
from dataclasses import dataclass, field, asdict
from typing import Any

from json import dumps, loads


@dataclass
class P:
    name: str
    type: str
    value: Any 
    default: Any = None
    description: str | None = None
    label: str | None = None
    placeholder: str | None = None
    
    enabled: bool = True
    visible: bool = True
    
    max: float | None = None
    min: float | None = None
    step: float | None = None
    
    
    def __post_init__(self):
        if self.default is None:
            self.default = self.value
            
    def __setattr__(self, name, value):
        postinit = 'name' in self.__dict__
        if postinit and name == 'name':
            print('Renaming after init is PROHIBITED')
        else:
            super().__setattr__(name, value)
            
    def __repr__(self):
                
        return f'{self.name } [{self.type}]: {self.value}'
    
    def __eq__(self, other):
        return self.value == other

    def __add__(self, other):
        return self.value + other

    def __radd__(self, other):
        return other + self.value

    def __sub__(self, other):
        return self.value - other

    def __rsub__(self, other):
        return other - self.value

    def __mul__(self, other):
        return self.value * other

    def __rmul__(self, other):
        return other * self.value

    def __truediv__(self, other):
        return self.value / other

    def __rtruediv__(self, other):
        return other / self.value

    def __int__(self):
        return int(self.value)

    def __float__(self):
        return float(self.value)

    def __str__(self):
        return str(self.value)


    def __bool__(self):
        return bool(self.value)
    
    
    
  
@dataclass 
class ParameterGroup:
    children: list = field(default_factory=list)
    name: str | None = 'Parameters'

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
                        
            if name[0] == '_':
                print(f'"{name}" is private...')
            elif name in self._child_map:
                self._child_map[name].value = value
                
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