# Mindustry Processor Programming

Programming Mindustry processors was always hard. But I have the solution - MPPL - Mindustry Processor Programming
Language. You can open [the home page](https://mindustry-proc-programming.web.app/v2/) directly in your browser, or you can
clone this repository and run the `public/v2/index.html` file locally.
![A smiley face composed of Mindustry processors](processor.png)

Here You can see the new MPPL syntax (V2, based on JS):

```javascript
// Comments start with //
// Multiline comments are surrounded with /* and */

///////////////////////
// Declare variables //
///////////////////////
// A constant variable of type NUMBER
const a = a() + 8 + math.angleDiff(3, 9)
// Multiple mutable variables of type STRING
let b = "hello world", c = '*multiline*'
// The color syntax is intuitive - not implemented yet
let d = packcolor(0xaa, 0xbb, 0xcc, 0xdd)//0caabbccdd
// Wrong colors get highlighted - not implemented yet
// let e = 0cabc
// Get the arguments of a block
const size = @size of @duo
// A more English approach
const items = @items in conveyor1

/////////////////////////
// Other functionality //
/////////////////////////
// Declare functions - not implemented yet
/*function ahoj(NUMBER param1, param2; STRING err){
    if (param1  < 5) raiseToDefineMethod(err)
    return 69 * param1 + param2
}*/
// Call functions like so:
init(arg1, 8, true, arg4)

// Switch statement - not implemented yet
/*switch (a) {
    case 0:
        print("Got 0")
    case 1:
        print("Got 1")
    default:
        print("Got something else")
}*/

// This while loop
let a = 0
while (a < 8) {
    doSomething()
    a = a + 1
}
// Is almost the equivalent of this one
let a = 0
do {
    doSomething()
    a = a + 1
} while (a < 8)
// Which can be further simplified to this:
for (let a = 0; a < 8; a = a + 1){
    doSomething()
}
// Some iteration manipulation
let a = 0
while (true) {
    if (a >= 8) break
    else if (a == 3) continue
    doSomething()
    a = a + 1
}

// As you have seen, flow control is straightforward
if (a > 2) a = 2
else if (a < 0 - 2) a = 0 - 2
else a = math.rand(a)
```

Here You can see the old MPPL syntax:

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
