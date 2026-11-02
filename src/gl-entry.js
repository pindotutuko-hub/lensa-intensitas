import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
window.THREE=THREE; window.OrbitControls=OrbitControls; window.Sky=Sky; window.RoomEnvironment=RoomEnvironment; window.mergeGeometries=mergeGeometries;
