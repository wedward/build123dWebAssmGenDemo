from dataclasses import dataclass, field, asdict
from typing import Any

from json import dumps, loads

from build123d import *
# from ocp_vscode import show


@dataclass
class P:
    name: str
    type: str
    v: Any 
    default: Any = None
    description: str | None = None
    
    enabled: bool = True
    visible: bool = True
    
    max: float | None = None
    min: float | None = None
    step: float | None = None
    
    
    def __post_init__(self):
        if self.default is None:
            self.default = self.v
            
    def __setattr__(self, name, value):
        postinit = 'name' in self.__dict__
        if postinit and name == 'name':
            print('Renaming after init is PROHIBITED')
        else:
            super().__setattr__(name, value)
            
    def __repr__(self):
                
        return f'{self.name } [{self.type}]: {self.v}'
    
  
@dataclass 
class ParameterGroup:
    name: str
    children: list = field(default_factory=list)

    
    def __post_init__(self):
        # self._child_map = {child.n: child for child in self.children}
        self._child_map = {}
        for child in self.children:
            self.add(child)

    def __getattr__(self, name):
        if name in self._child_map:
            return self._child_map[name]
        raise AttributeError(f"'ParameterGroup' object has no attribute '{name}'")
    
    def __setattr__(self, name, value):

        if "_child_map" in self.__dict__:
            ## Check if post-init
            print(name in self._child_map)
            
            if name[0] == '_':
                print(f'"{name}" is private...')
            elif name in self._child_map:
                self._child_map[name].v = value
                
            elif name == 'children':
                print(f'Not supported. Try ParameterGroup.add()')
            else:
                super().__setattr__(name, value)
            
        else:
            ## Python default 
            super().__setattr__(name, value)


    
    def __repr__(self):
        out = self.name + ': \n'
        for c in self.children:
            out += c.__repr__() + '\n'
        
        return out
    
    def add(self, param: P):
        if param.name in self._child_map:
            print(f'Name "{param.name}" is already in use -- pass')
        else:
            
            if param not in self.children:
                self.children.append(param)
            self._child_map[param.name] = param
    
    def dumps(self):
        return dumps(asdict(self))
    
    def load(self, data):
        pass


def loadParam(data):
    
    if type(data) == str:
        data = loads(data)
    
    if 'children' in data:
        return ParameterGroup (name=data['name'], children= [ loadParam(param) for param in data['children'] ] )
    else:
        return P(**data)


###

###


## check to see if params have been inserted
if "params" in locals():
    g = loadParam(params)
    
## otherwise build the parameters
else:
    h = P( 'height','num', 20, min=1, max=100, step=0.1 )
    w = P( 'width' ,'num', h.v/3.0, min=1, max=100, step=0.1 )
    d = P( 'depth', 'num', h.v + w.v * 0.5 )

    g = ParameterGroup('Parameters', [h, w] )
    g. add( d )

data = asdict( g )
json = g.dumps()

print(g)

box = Box( g.height.v, g.children[1].v, d.v )
print(f"Box: {box.area} ")
