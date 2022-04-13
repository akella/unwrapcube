

import * as THREE from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
// import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
const random = require('canvas-sketch-util/random');
import { Text,preloadFont } from 'troika-three-text'

import fragment from "./shader/fragment.glsl";
import vertex from "./shader/vertex.glsl";
import * as dat from "dat.gui";
const createInputEvents = require('simple-input-events');
import gsap from "gsap";
 

import timage from '../images/timage.png';


import aimage from '../images/image.jpg';

import font from '../font.woff'


import bg from '../images/image.jpg';

import h from '../images/l.png'
import h1 from '../images/t.png'
import h2 from '../images/h2.png'


function toRadians(angle) {
	return angle * (Math.PI / 180);
}

function toDegrees(angle) {
	return angle * (180 / Math.PI);
}
function smoothstep (min, max, value) {
  var x = Math.max(0, Math.min(1, (value-min)/(max-min)));
  return x*x*(3 - 2*x);
};

function clamp(number, min, max) {
  return Math.max(min, Math.min(number, max));
}

export default class Sketch {
  constructor(options) {

    this.sides =  [
       {
        key: 'front',
        texture: timage,
        texture1: aimage,
        angle: new THREE.Euler( 0, 0, 0 ),
        url: 'http://google.com/',
        text: '111111',
        textorientation: "top"
      },
      {
        key: 'back',
        texture: timage,
        texture1: aimage,
        angle: new THREE.Euler( 0, Math.PI, 0 ),
        url: 'http://google.com/',
        text: '22222',
        textorientation: "top"
      },
      {
        key: 'bottom',
        texture: timage,
        texture1: aimage,
        angle: new THREE.Euler( -Math.PI/2, 0, 0 ),
        url: 'http://google.com/',
        text: '3333'
      },
      {
        key: 'left',
        texture: timage,
        texture1: aimage,
        angle: new THREE.Euler( 0, Math.PI/2, 0 ),
        url: 'http://google.com/',
        text: 'PROMOTION'
      },
      {
        key: 'right',
        texture: timage,
        texture1: aimage,
        angle: new THREE.Euler( 0, -Math.PI/2, 0 ),
        url: 'http://google.com/',
        text: '55555'
      },
       {
        key: 'top',
        texture: timage,
        texture1: aimage,
        angle: new THREE.Euler( Math.PI/2, -Math.PI/2, 0 ),
        url: 'http://google.com/',
        text: '6666',
        textorientation: "top"
      },
    ]
    this.scene = new THREE.Scene();

    this.container = options.dom;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer = new THREE.WebGLRenderer({
      alpha: true
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(this.width, this.height);
    // this.renderer.setClearColor(0xeeeeee, 1); 
    this.renderer.physicallyCorrectLights = true;
    this.renderer.outputEncoding = THREE.sRGBEncoding;

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2(-100,1000);

    this.spherical = new THREE.Spherical();
    this.rotationMatrix = new THREE.Matrix4();
    this.targetQuaternion = new THREE.Quaternion();
    this.isRotating = true;
    this.isMoving = true;
    this.event = createInputEvents(this.renderer.domElement);

    this.container.appendChild(this.renderer.domElement);

    // this.camera = new THREE.PerspectiveCamera(
    //   70,
    //   window.innerWidth / window.innerHeight,
    //   0.001,
    //   1000
    // );

    var frustumSize = 3;
    var aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.OrthographicCamera( frustumSize * aspect / - 2, frustumSize * aspect / 2, frustumSize / 2, frustumSize / - 2, -1000, 1000 );
    this.camera.position.set(0, 0, 3);
    // this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.time = 0;
    this.movingTime = 0;
    this.centerdistance = 0;
    this.previousMousePosition = {
        x: 0,
        y: 0
    };

    this.isPlaying = true;

    this.speed = {
      x:0,
      y: 0,
    }

    preloadFont(
      {
        font: font,
        characters: 'abcdefghijklmnopqrstuvwxyzАаБбВвГгДдЕеЁёЖжЗзИиЙйКкЛлМмНнОоПпРрСсТтУуФфХхЦцЧчШшЩщЪъЫыЬьЭэЮюЯяіІєЄэЭїЇґҐ'
      },
      () => {
        this.settings();
        this.addObjects();
        this.mouseEvents()
        this.resize();
        this.render();
        this.setupResize();
      }
    )
    
    
    
    
  }
  mouseEvents(){

    this.container.addEventListener( 'mousemove', (event)=>{
      let bounds = this.container.getBoundingClientRect();
      // console.log(bounds)
      this.mouse.x = ( (event.clientX - bounds.x) / this.width ) * 2 - 1;
      this.mouse.y = - ( (event.clientY - bounds.y) /this.height ) * 2 + 1;
    }, false );


    this.event.on('move', ({ position, event, inside, dragging }) => {
      let bounds = this.container.getBoundingClientRect();
      this.mouse.x = ( (position[0] ) / this.width ) * 2 - 1;
      this.mouse.y = - ( (position[1] ) /this.height ) * 2 + 1;

      let deltaMove = {
          x: position[0]-this.previousMousePosition.x,
          y: position[1]-this.previousMousePosition.y
      };
      
      if(dragging){
        this.speed.x +=deltaMove.x;
        this.speed.y +=deltaMove.y;
        // console.log(deltaMove,'deltaMove')
        
      }

      // this.cubewrap.rotation.x = Math.PI/2

      this.previousMousePosition = {
          x: position[0],
          y: position[1]
      };

      // console.log(dragging)

    })

    this.currentMouseover= null;
    window.addEventListener('mousemove',()=>{
      // update the picking ray with the camera and mouse position
      this.raycaster.setFromCamera( this.mouse, this.camera );

      // calculate objects intersecting the picking ray
      const intersects = this.raycaster.intersectObjects( this.meshes );

      

      // if(intersects[0]  && this.settings.progress<0.99){
      //   let meshto = intersects[0].object;
      //   clearTimeout(meshto.userData.timeout)

      //   let q = meshto.userData.quaternion
      //   // this.rotateTo(q)
      //   // console.log(meshto.material)
      //   gsap.to(meshto.material.uniforms.progress,{
      //     duration: 0.5,
      //     value: 1,
      //     onComplete: ()=>{
            
      //       meshto.userData.timeout = setTimeout(()=>{

      //         gsap.to(meshto.material.uniforms.progress,{
      //           value: 0,
      //           duration: 1
      //         })
      //       },1000)

      //     }
      //   })
      // } 

      if(this.settings.progress<0.99){
      if(intersects[0]){

        let meshto = intersects[0].object;

        if(this.currentMouseover && this.currentMouseover.uuid==meshto.uuid){
          // the same object, do nothing
        } else{
          // new object
          if(this.currentMouseover){
            // run mouseOut for OLD
            mouseOut(this.currentMouseover)
          }
          mouseOn(meshto);
          this.currentMouseover = meshto;
        }

      } else{
        if(this.currentMouseover) {
          mouseOut(this.currentMouseover)
          this.currentMouseover = null;
        }
      }

    }
      
      
    })


    let that = this;

    function mouseOn(mesh){
      // console.log('mouseon',mesh.userData.text)
      mesh.userData.text.color = 0xffffff
      mesh.userData.text.sync()
      gsap.to(mesh.material.uniforms.progress,{
        duration: 0.5,
        value: 1,
        overwrite: true
      })
      // gsap.to(that.mysettings,{
      //   duration: 0.5,
      //   moving: 0,
      //   overwrite: true
      // })
    }

    function mouseOut(mesh){
      // console.log('mouseoff',mesh.userData.text)
      gsap.to(mesh.material.uniforms.progress,{
          duration: 0.5,
          value: 0,
          overwrite: true
        })

        // that.isRotating = true;
        // that.mysettings.moving = 1
        mesh.userData.text.color = 0x000000
        mesh.userData.text.sync()

        gsap.to(mesh.material.uniforms.progress,{
          value: 0,
          duration: 0.3,
          overwrite: true
        })
    }



    window.addEventListener('click',()=>{
      // update the picking ray with the camera and mouse position
      this.raycaster.setFromCamera( this.mouse, this.camera );


      const intersects = this.raycaster.intersectObjects( this.meshes );
      if(intersects[0] && this.settings.progress==0){
        let meshto = intersects[0].object;
        console.log('GOTOURL:',meshto.userData.url)
        // window.location = meshto.userData.url
      } 


    })
  }


  cubeRotation(){
    let deltaRotationQuaternion = new THREE.Quaternion()
        .setFromEuler(new THREE.Euler(
            toRadians(this.speed.y * 0.1 + 0.06*this.settings.progress),
            toRadians(this.speed.x * 0.1 + 0.06*this.settings.progress),
            0,
            'XYZ'
        ));

    this.cubewrap.quaternion.multiplyQuaternions(deltaRotationQuaternion, this.cubewrap.quaternion);
    this.cubewrap.rotation.x = this.cubewrap.rotation.x*this.settings.progress
    this.cubewrap.rotation.y = this.cubewrap.rotation.y*this.settings.progress
    this.cubewrap.rotation.z = this.cubewrap.rotation.z*this.settings.progress
  
  }

  settings() {
    let that = this;
    this.settings = {
      progress: 0,
      rotation: 0,
      moving: 0,
      centerdistance: 0,
      // rotateTo: 0,
      // rotate: ()=>{
      //   that.rotateTo(this.settings.rotate);
      // },
    };
    this.gui = new dat.GUI();
    this.gui.add(this.settings, "progress", 0, 1, 0.01);
    this.gui.add(this.settings, "rotation", 0, 1, 0.01);
    this.gui.add(this.settings, "moving", 0, 1, 0.01);
    this.gui.add(this.settings, "centerdistance", 0, 1, 0.01);
    // this.gui.add(this.settings, "rotateTo",0,5,1);
    // this.gui.add(this.settings, "rotate");
  }

  setupResize() {
    window.addEventListener("resize", this.resize.bind(this));
  }

  resize() {
    
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;
    

    // image cover
    this.imageAspect = 853/1280;
    let a1; let a2;
    if(this.height/this.width>this.imageAspect) {
      a1 = (this.width/this.height) * this.imageAspect ;
      a2 = 1;
    } else{
      a1 = 1;
      a2 = (this.height/this.width) / this.imageAspect;
    }

    this.material.uniforms.resolution.value.x = this.width;
    this.material.uniforms.resolution.value.y = this.height;
    this.material.uniforms.resolution.value.z = a1;
    this.material.uniforms.resolution.value.w = a2;


    // optional - cover with quad
    // const dist  = this.camera.position.z;
    // const height = 1;
    // this.camera.fov = 2*(180/Math.PI)*Math.atan(height/(2*dist));

    // // if(w/h>1) {
    // if(this.width/this.height>1){
    //   this.plane.scale.x = this.camera.aspect;
    //   // this.plane.scale.y = this.camera.aspect;
    // } else{
    //   this.plane.scale.y = 1/this.camera.aspect;
    // }

    this.camera.updateProjectionMatrix();


  }


  rotateTo(q){
    let o = {p:0};
    let that = this;
    if(!this.isRotating) return;
    this.isRotating = false
    let start = this.cubewrap.quaternion.clone();
  
    gsap.defaults({overwrite: "auto"});
    gsap.to(o,{
      p:1,
      duration:0.6,
      overwrite: 'auto',
      onUpdate:()=>{
        // console.log(o.p,this.isRotating)
        let targetQuaternion = this.cubewrap.quaternion.clone();
        // targetQuaternion.setFromEuler( new THREE.Euler( 0, Math.PI, 0 ) );
        targetQuaternion.slerpQuaternions ( q, start,1.-o.p )
        this.cubewrap.quaternion.copy(targetQuaternion)
        this.isRotating = false
      },
      onComplete: ()=>{
        let ms = that.meshes.map(m=>m.material.uniforms.progress)
        // console.log(ms)
        setTimeout(()=>{
          this.isRotating = true;
          this.settings.moving = 1
          
          gsap.to(ms,{
            value: 0,
            duration: 1
          })
        },1000)
      }
    })
  }

  getMaterial(t,t1){
    

    // let m = new THREE.MeshBasicMaterial({
    //   // color:0xffffff*Math.random(),
    //   side: THREE.DoubleSide,
    //   map: new THREE.TextureLoader().load(t)
    // })
    let m = this.material.clone();
    let texture = new THREE.TextureLoader().load(t)
    let texture1 = new THREE.TextureLoader().load(t1)
    texture.anisotropy = texture1.anisotropy = this.renderer.getMaxAnisotropy()
    m.uniforms.t1.value = texture;
    m.uniforms.t2.value = texture1;
    return m;
  }

  addObjects() {
    let that = this;
    // this.cubewrap.quaternion.rotateTowards( this.targetQuaternion, 0.1 );
    this.material = new THREE.ShaderMaterial({
      extensions: {
        derivatives: "#extension GL_OES_standard_derivatives : enable"
      },
      side: THREE.DoubleSide,
      uniforms: {
        progress: { value: 0 },
        time: { value: 0 },
        t1: { value: null },
        t2: { value: null },
        resolution: { value: new THREE.Vector4() },
      },
      // wireframe: true,
      // transparent: true,
      vertexShader: vertex,
      fragmentShader: fragment
    });
    let tempQuaternion = new THREE.Quaternion();
    

    this.geometry = new THREE.PlaneGeometry(1, 1, 1, 1);
    this.geometry1 = new THREE.PlaneGeometry(0.25,1, 1, 1);
    this.geometry2 = new THREE.PlaneGeometry(1,0.25, 1, 1);

    this.sides.forEach(side=>{

      let text = new Text()
      text.text = side.text
      text.fontSize = 0.07
      text.color = 0x000000
      text.anchorX = 0.43;
      text.anchorY = 0.33
      if(side.textorientation) text.anchorY = -0.43

      // Update the rendering:
      text.sync()
      this[side.key+'Text']=text;


      this[side.key] = new THREE.Mesh(this.geometry, this.getMaterial(side.texture,side.texture1));
      tempQuaternion.setFromEuler( side.angle );
      this[side.key].userData.quaternion = tempQuaternion.clone();
      this[side.key].userData.text = text;
      this[side.key].userData.url = side.url;
    })


    this.leftH = new THREE.Mesh(this.geometry1, new THREE.MeshBasicMaterial({
      color:0xffffff,
      side: THREE.DoubleSide,
      transparent: true,
      map: new THREE.TextureLoader().load(h)
    }));
    this.leftHG = new THREE.Group();
    this.leftHG.add(this.leftH)


    this.bottomH = new THREE.Mesh(this.geometry2, new THREE.MeshBasicMaterial({
      color:0xffffff,
      side: THREE.DoubleSide,
      transparent: true,
      map: new THREE.TextureLoader().load(h2)
    }));
    this.bottomHG = new THREE.Group();
    this.bottomHG.add(this.bottomH)


    this.topH = new THREE.Mesh(this.geometry2, new THREE.MeshBasicMaterial({
      color:0xffffff,
      side: THREE.DoubleSide,
      transparent: true,
      map: new THREE.TextureLoader().load(h1)
    }));
    this.topHG = new THREE.Group();
    this.topHG.add(this.topH)

    // this.front = new THREE.Mesh(this.geometry, this.getMaterial('front'));
    //   tempQuaternion.setFromEuler( new THREE.Euler( 0, 0, 0 ) );
    //   this.front.userData.quaternion = tempQuaternion.clone();
    // this.top = new THREE.Mesh(this.geometry, this.getMaterial('left'));
    //   tempQuaternion.setFromEuler( new THREE.Euler( Math.PI/2, -Math.PI/2, 0 ) );
    //   this.top.userData.quaternion = tempQuaternion.clone();
    // this.left = new THREE.Mesh(this.geometry, this.getMaterial('top'));
    //   tempQuaternion.setFromEuler( new THREE.Euler( 0, Math.PI/2, 0 ) );
    //   this.left.userData.quaternion = tempQuaternion.clone();
    // this.bottom = new THREE.Mesh(this.geometry, this.getMaterial('bottom'));
    //   tempQuaternion.setFromEuler( new THREE.Euler( -Math.PI/2, 0, 0 ) );
    //   this.bottom.userData.quaternion = tempQuaternion.clone();
    // this.right = new THREE.Mesh(this.geometry, this.getMaterial('right'));
    //   tempQuaternion.setFromEuler( new THREE.Euler( 0, -Math.PI/2, 0 ) );
    //   this.right.userData.quaternion = tempQuaternion.clone();
    // this.back = new THREE.Mesh(this.geometry, this.getMaterial('back'));
    //   tempQuaternion.setFromEuler( new THREE.Euler( 0, Math.PI, 0 ) );
    //   this.back.userData.quaternion = tempQuaternion.clone();

    this.meshes = [this.front,this.top,this.left,this.bottom,this.right,this.back]
    
    
    this.cube = new THREE.Group();
    this.cubewrap = new THREE.Group();
    this.gtop = new THREE.Group();
    this.gleft = new THREE.Group();
    this.gbottom = new THREE.Group();
    this.gback = new THREE.Group();
    this.gright = new THREE.Group();
    
    this.gleft.add(this.left);
    this.gleft.add(this.leftText);
    this.gtop.add(this.top);
    this.gtop.add(this.topText);
    this.gbottom.add(this.bottom);
    this.gbottom.add(this.bottomText);
    this.gright.add(this.right);
    this.gright.add(this.rightText);
    this.gright.add(this.gtop);
    this.gright.add(this.gback)
    this.gback.add(this.back)
    this.gback.add(this.backText)
    this.cube.add(this.gright)
    this.cube.add(this.gleft)
    this.cube.add(this.gbottom)
    this.cube.add(this.front);
    this.cube.add(this.frontText);
    this.cubewrap.add(this.cube)
    this.scene.add(this.cubewrap)

    let s = 0.003;
    this.front.position.z = 0.5;
    this.frontText.position.z = 0.5 + s;
    this.gleft.position.z = 0.5 ;
    this.gright.position.z = 0.5;
    this.gbottom.position.z = 0.5;


    this.s =s;
    this.top.position.y = 0.5;
    this.topText.position.y = 0.5 + s;
    this.topText.position.z =  s;
    this.gtop.position.y = 0.5 -s;
    this.gtop.position.x = 0.5-s;

    this.topHG.position.y = +1;
    this.topH.position.y = +0.125;

    this.left.position.x = -0.5 + s;
    this.leftText.position.x = -0.5 + s;
     this.leftText.position.z = s ;
    this.gleft.position.x = -0.5;

    this.leftHG.position.x = -1 + s;
    this.leftH.position.x = -0.125;

    this.bottom.position.y= -0.5 + s;
    this.bottomText.position.y = -0.5 + s;
    this.bottomText.position.z = s;
    this.gbottom.position.y = -0.5;

    this.bottomHG.position.y = -1 +s;
    this.bottomH.position.y = -0.125;

    this.back.position.x = .5 - 2*s;
    this.backText.position.x= .5 - 2*s;
    this.backText.position.z= s;
    this.gback.position.x = 1.;

    this.right.position.x = .5 - s;
    this.rightText.position.x  = .5 - s;
    this.rightText.position.z  = s;
    this.gright.position.x = 0.5;


  }

  stop() {
    this.isPlaying = false;
  }

  play() {
    if(!this.isPlaying){
      this.render()
      this.isPlaying = true;
    }
  }

  render() {
    // console.log(this.isRotating)
    if (!this.isPlaying) return;
    this.time += 0.05;
    this.movingTime += this.settings.moving*0.005;
    let z = 0.5 + 0.5*Math.sin(this.time/5)
    z = this.settings.progress;

    this.cubeRotation()

    this.speed.x *=0.95;
    this.speed.y *=0.95;
    // z = 1;
    let s = (this.s)*(1. - this.settings.progress)
    // fix sizes
    this.gtop.position.y = 0.5 -s;
    this.gtop.position.x = 0.5-s;
    this.left.position.x = -0.5 + s;
    this.leftHG.position.x = -1 + s;
    this.bottom.position.y = -0.5 + s;
    this.bottomHG.position.y = -1 +s;
    this.back.position.x = .5 - 2*s;
    this.right.position.x = .5 - s;


    // this.sides.forEach((side,i)=>{
    //   let an;
    //   if(this.settings.progress==1) {
    //   let start = new THREE.Vector3(0,0,1);
    //   let sideq = this[side.key].userData.quaternion.clone();
    //   let current = this.cubewrap.quaternion.clone();
    //   let currentDir = start.clone().applyQuaternion(current).normalize();
      
    //   let currentSideDir = start.clone().applyQuaternion(sideq).applyQuaternion(current).normalize();
    //   if(i===5) currentSideDir = new THREE.Vector3(0,1,0).applyQuaternion(current).normalize();

    //   let angleto = currentDir.dot(currentSideDir);
    //   angleto = start.angleTo(currentSideDir)
    //   an = Math.min(Math.abs(angleto), Math.abs(Math.PI - angleto))
    //   an = clamp(an,0,1);
    //   // console.log(angleto,currentDir, currentSideDir)
    //   this[side.key].material.uniforms.progress.value = smoothstep(0.5,0.7,1- an)
    // }  else{
    //   this[side.key].material.uniforms.progress.value = 0
    // }
 

      


    // })

    
    // this.cubewrap.quaternion.copy( this.targetQuaternion);

    // if(this.isRotating &&  this.cubewrap){
    //   this.cubewrap.rotation.y += this.settings.rotation*0.01;
    //   this.cubewrap.rotation.x -= this.settings.rotation*0.01;
    //   this.cubewrap.rotation.z += this.settings.rotation*0.01;

    //   //
    //   this.cubewrap.rotation.y *= this.settings.progress;
    //   this.cubewrap.rotation.x *= this.settings.progress;
    //   this.cubewrap.rotation.z *= this.settings.progress;
      
    // }
    
    if(this.isMoving &&  this.cubewrap){
      let radius = (2*this.settings.centerdistance + (random.noise1D(this.movingTime) - 0.5)*0.3)*(this.settings.progress)
      this.cubewrap.position.x = radius*Math.sin(this.movingTime)
      this.cubewrap.position.y = radius*Math.cos(this.movingTime)/this.camera.aspect
    }


    this.gtop.rotation.x = -z*Math.PI/2
    this.topHG.rotation.x = -z*Math.PI/2 - 0.1
    this.gleft.rotation.y = -z*Math.PI/2
    this.leftHG.rotation.y = -z*Math.PI/2 - 0.1
    this.gbottom.rotation.x = z*Math.PI/2
    this.bottomHG.rotation.x = z*Math.PI/2 + 0.1
    this.gback.rotation.y = z*Math.PI/2
    this.gright.rotation.y = z*Math.PI/2
    this.leftH.material.opacity = this.topH.material.opacity = this.bottomH.material.opacity = 1-z;

    // console.log(this.cubewrap.quaternion);
    this.material.uniforms.time.value = this.time;
    requestAnimationFrame(this.render.bind(this));
    this.renderer.render(this.scene, this.camera);
  }
}

new Sketch({
  dom: document.getElementById("container")
});
