# Mindustry Processor Programming

Programming Mindustry processors was always hard. But I have the solution - MPPL - Mindustry Processor Programming
Language. You can open [the home page](https://mindustry-proc-programming.web.app/) directly in your browser, or you can
clone this repository and run the `public/index.html` file locally.
![A Mindustry processor](processor.png)

Here You can see the MPPL syntax:

```mppl
## Comments start with ##
## Multiline comments are surrounded with #* and *#

#######################
## Declare variables ##
#######################
## A constant variable of type NUMBER
const NUMBER a = a() + 8 + 3 angle-diff 9
## Multiple mutable variables of type STRING
STRING b = "hello world", c = '*multiline*'
## The color syntax is intuitive
COLOR d = 0caabbccdd
## Wrong colors get highlighted
COLOR e = 0cabc
## Now the pointer hell: this is a pointer to an ITEM
*ITEM ptr = @titanium ## itemPointer 'called' at compilation
## Dereference the pointer to an item
ITEM item = &ptr
## Create a reference to the item once again
*ITEM backPtr = itemPointer(item)
## Get the arguments of a block
NUMBER size = @size of 8
## A more English approach
NUMBER items = @items in 8

#########################
## Other functionality ##
#########################
## Declare functions
function ahoj(NUMBER param1, param2; STRING err){
    if (param1  < 5) raiseToDefineMethod(err)
    return 69 * param1 + param2
}
## Call functions like so:
init(arg1, 8, true, arg4)

## Switch statement
switch (a) {
    case 0:
        print("Got 0")
    case 1:
        print("Got 1")
    default:
        print("Got something else")
}

## This while loop
NUMBER a = 0
while (a < 8) {
    doSomething()
    a = a + 1
}
## Is the equivalent of this one
NUMBER a = 0
do {
    doSomething()
    a = a + 1
} while (a < 8)
## Which can be further simplified to this:
for (NUMBER a = 0; a < 8; a = a + 1){
    doSomething()
}
## Some iteration manipulation
NUMBER a = 0
while (true) {
    if (a >= 8) break
    else if (a == 3) continue
    doSomething()
    a = a + 1
}

## As you have seen, flow control is simple
if (a > 2) a = 2
else if (a < 0 - 2) a = 0 - 2
else a = rand a
```
