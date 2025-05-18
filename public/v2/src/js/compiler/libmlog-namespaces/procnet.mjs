/**
 * @author Jakub Augustýn <kubik.augustyn@post.cz>
 * @copyright Jakub Augustýn <kubik.augustyn@post.cz>
 * @home https://jakub-augustyn.web.app/
 */

import {NativeFunction, NativeJITFunction} from "../NativeFunction.mjs";
import {
    JumpInstruction, OperationInstruction,
    ReadInstruction,
    UnitBindInstruction,
    UnitControlInstruction, UnitLocateInstruction, UnitRadarInstruction
} from "../../intructions/instructions.mjs";
import DynamicLink from "../../intructions/DynamicLink.mjs";

/**
 * @readonly
 * @type {ReadonlyMap<string, string>}
 */
const constants = Object.freeze(new Map(Object.entries({
    LOCKSTATE_READY: "0",
    LOCKSTATE_LOCKED: "1",
    LOCKSTATE_READ_READY: "2",
    LOCKSTATE_READING: "3",
    ID_MASK: "1048575", //  = (1 << 20) - 1
    PACKET_CAPACITY: "16", // = 64 / 4
    ID: "(((@thisx & 1023) << 10) | (@thisy & 1023))",
})))

/**
 * @readonly
 * @type {TNativeNamespace}
 */
const liblowlevel = Object.freeze(new Map(Object.entries({
    // Sub-namespaces
    // Functions
    lock: new NativeJITFunction(["port", "slot"], null, `
const __TMP_0__ = __CONST_LOCKSTATE_LOCKED__ << 20 | ID // "LOCKED_OURS"
const __TMP_1__ = __ARG_slot__ << 2 // "slotBaseAddress"
while ((__ARG_port__[__TMP_1__] >> 20) != __CONST_LOCKSTATE_READY__) {}
__ARG_port__[__TMP_1__] = __TMP_0__
wait(0.05)
__RETURN__ = __ARG_port__[__TMP_1__] == __TMP_0__
`, constants),
    getState: new NativeJITFunction(["port", "slot"], null, `
__TMP_0__ = __ARG_port__[__ARG_slot__ << 2] // "slotValue"
__RETURN_0__ = __TMP_0__ >> 20
__RETURN_1__ = __TMP_0__ & __CONST_ID_MASK__
`, constants),
    unsafeSetState: new NativeJITFunction(["port", "slot", "lockstate", "id"], null, `
__ARG_port__[__ARG_slot__ << 2] = __ARG_lockstate__ << 20 | __ARG_id__
`, constants),
    findSlotWithState: new NativeJITFunction(["port", "lockstate"], null, `
// WARNING: The state may have changed at the time the value is returned!
while (true) {
    for (__RETURN__ = 0; __RETURN__ < __CONST_PACKET_CAPACITY__; __RETURN__++) {
        __TMP_0__, _ = procnet.lowlevel.getState(__ARG_port__, __RETURN__)
        if (__TMP_0__ == __ARG_lockstate__) break
    }
    
    __TMP_0__, _ = procnet.lowlevel.getState(__ARG_port__, __RETURN__)
    if (__TMP_0__ == __ARG_lockstate__) break
}
`, constants),
    findAnySlotWithState: new NativeJITFunction(["lockstate"], null, `
// WARNING: The state may have changed at the time the value is returned!
__TMP_0__ = false // "found"
while (true) {
    for (__TMP_1__ = 0; __TMP_1__ < @links; __TMP_1__++) {
        __RETURN_0__ = getlink(__TMP_1__) // "port"
        if ((@type of __RETURN_0__) != @memory-cell) continue 
    
        for (__RETURN_1__ = 0; __RETURN_1__ < __CONST_PACKET_CAPACITY__; __RETURN_1__++) {
            __TMP_2__, _ = procnet.lowlevel.getState(__RETURN_0__, __RETURN_1__)
            if (__TMP_2__ == __ARG_lockstate__) {
                __TMP_0__ = true
                break
            }
        }
        
        if (__TMP_0__) break
    }
    
    if (__TMP_0__) break
}
// return port, slot
`, constants),
    packPacket: new NativeJITFunction(["srcID", "dstID", "type", "flags", "payload"], null, `
__RETURN_0__ = ((__ARG_type__  << 20) | __ARG_dstID__) & 0xFFFFFFFF
__RETURN_1__ = ((__ARG_flags__ << 20) | __ARG_srcID__) & 0xFFFFFFFF
__RETURN_2__ = (__ARG_payload__                      ) & 0xFFFFFFFF
`, constants),
    unpackPacket: new NativeJITFunction(["word0", "word1", "word2"], null, `
__RETURN_0__ = __ARG_word1__ & __CONST_ID_MASK__
__RETURN_1__ = __ARG_word0__ & __CONST_ID_MASK__
__RETURN_2__ = __ARG_word0__ >> 20
__RETURN_3__ = __ARG_word1__ >> 20
__RETURN_4__ = __ARG_word2__
`, constants),
    unpackPacketDstID: new NativeJITFunction(["word0", "word1", "word2"], null, `
__RETURN__ = __ARG_word0__ & __CONST_ID_MASK__
`, constants),
    writePacket: new NativeJITFunction(["port", "slot", "word0", "word1", "word2"], null, `
const __TMP_0__ = __ARG_slot__ << 2 // "slotBaseAddress"
__ARG_port__[__TMP_0__ + 1] = __ARG_word0__
__ARG_port__[__TMP_0__ + 2] = __ARG_word1__
__ARG_port__[__TMP_0__ + 3] = __ARG_word2__
`, constants),
    readPacket: new NativeJITFunction(["port", "slot"], null, `
const __TMP_0__ = __ARG_slot__ << 2 // "slotBaseAddress"
__RETURN_0__ = __ARG_port__[__TMP_0__ + 1]
__RETURN_1__ = __ARG_port__[__TMP_0__ + 2]
__RETURN_2__ = __ARG_port__[__TMP_0__ + 3]
`, constants),
    sendPacket: new NativeJITFunction(["port", "srcID", "dstID", "type", "flags", "payload"], null, `
__TMP_0__, __TMP_1__, __TMP_2__ = procnet.lowlevel.packPacket(__ARG_srcID__, __ARG_dstID__, __ARG_type__, __ARG_flags__, __ARG_payload__) // "word0", "word1", "word2"
while (true) {
    __TMP_3__ = procnet.lowlevel.findSlotWithState(__ARG_port__, __CONST_LOCKSTATE_READY__) // "slot"
    __TMP_4__ = procnet.lowlevel.lock(__ARG_port__, __TMP_3__) // "locked"
    if (!__TMP_4__) continue
    procnet.lowlevel.writePacket(__ARG_port__, __TMP_3__, __TMP_0__, __TMP_1__, __TMP_2__)
    procnet.lowlevel.unsafeSetState(__ARG_port__, __TMP_3__, __CONST_LOCKSTATE_READ_READY__, __CONST_ID__)
    break
}
__RETURN__ = true
`, constants),
    recvPacket: new NativeJITFunction(["port"], null, `
while (true) {
    if (__ARG_port__ != null) __TMP_0__ = procnet.lowlevel.findSlotWithState(__ARG_port__, __CONST_LOCKSTATE_READ_READY__)
    else __ARG_port__, __TMP_0__ = procnet.lowlevel.findAnySlotWithState(__CONST_LOCKSTATE_READ_READY__)
    
    __TMP_1__, _ = procnet.lowlevel.getState(__ARG_port__, __TMP_0__)
    if (__TMP_1__ == __CONST_LOCKSTATE_READ_READY__) { // Just to make sure
        procnet.lowlevel.unsafeSetState(__ARG_port__, __TMP_0__, __CONST_LOCKSTATE_READING__, __CONST_ID__)
        __TMP_2__, __TMP_3__, __TMP_4__ = procnet.lowlevel.readPacket(__ARG_port__, __TMP_0__)
        __RETURN_0__, __RETURN_1__, __RETURN_2__, __RETURN_3__, __RETURN_4__ = procnet.lowlevel.unpackPacket(__TMP_2__, __TMP_3__, __TMP_4__)
        procnet.lowlevel.unsafeSetState(__ARG_port__, __TMP_0__, __CONST_LOCKSTATE_READY__, 0)
        break
    }
}
`, constants),
})))

/**
 * @readonly
 * @type {TNativeNamespace}
 */
const libprocnet = Object.freeze(new Map(Object.entries({
    // Sub-namespaces
    lowlevel: liblowlevel,
    // Functions
    // FIXME Uses hardcoded variable names
    router: new NativeJITFunction(["bank"], null, `
port = null // Cheat, will be set by the recvPacket function/macro
srcID, dstID, type, flags, payload = procnet.lowlevel.recvPacket(port)

if (dstID != __CONST_ID__) {
    let nodeID = null, linkIndex = null
    for (let i = 0; i < 512; i++) {
        const entry = __ARG_bank__[i]
        if (entry != 0) {
            if ((entry & __CONST_ID_MASK__) == srcID) {
                linkIndex = entry >> 20
                nodeID = srcID
                break
            }
            continue
        }
        
        for (let linkIndex = 0; linkIndex < @links; linkIndex++) {
            if (getlink(linkIndex) == port) break
        }
        __ARG_bank__[i] = (linkIndex << 20) | srcID
        break
    }
    println(srcID, " --> ", dstID, " - type: ", type, ", flags: ", flags, ", payload: ", payload)
    println("Node ID: ", nodeID, ", link index: ", linkIndex)
    let valid = port == getlink(linkIndex) // Does the packet come from the port a different packet with the same srcID came from in the past?
    println("Valid: ", valid) 
    printFlush(message1)
    
    if (valid) for (let i = 0; i < @links; i++) {
        const otherPort = getlink(i)
        if (otherPort == port) continue
        if ((@type of otherPort) != @memory-cell) continue
        
        // Broadcast the packet on all interfaces except the one that it was received on
        procnet.lowlevel.sendPacket(otherPort, srcID, dstID, type, flags, payload)
    } else {
        // TODO It is broken.
        procnet.lowlevel.sendPacket(port, srcID, dstID, type, flags, payload)
        wait(2.5)
    }
}
`, constants),
    endDeviceRecvPacket: new NativeJITFunction(["port"], null, `
while (true) {
    __RETURN_0__, __RETURN_1__, __RETURN_2__, __RETURN_3__, __RETURN_4__ = procnet.lowlevel.recvPacket(__ARG_port__)
    if (__RETURN_1__ == __CONST_ID__) break // If the packet's dstID == our ID, we can return it
}
`, constants),
    endDeviceSendPacket: new NativeJITFunction(["port", "dstID", "type", "flags", "payload"], null, `
__RETURN__ = procnet.lowlevel.sendPacket(__ARG_port__, __CONST_ID__, __ARG_dstID__, __ARG_type__, __ARG_flags__, __ARG_payload__)
`, constants),
})))
export default libprocnet
