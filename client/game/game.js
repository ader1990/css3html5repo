
$(document).ready(function () {

    //node stuff
    //
    //
    //
    //
    var existingObjectsId = [];
    var socket = io.connect('http://localhost:90');
    socket.on('client_inform', function (data) {
        console.log(data);
        if (data.data.id != masterObject.SESSION_ID) {

            if (existingObjectsId.indexOf(data.data.id) < 0) {
                existingObjectsId.push(data.data.id); //storing the new player's id

                //creating the graphics of the new player
                var geometryGuest = new THREE.SphereGeometry(0.275, 0.275, 0.275);
                var objectGuest = new THREE.Mesh(geometryGuest, material2);
                var MasterObjectGuest = new MovableObject(objectGuest, masterObject.level);
                MasterObjectGuest.velocity = data.data.velocity;
                MasterObjectGuest.SESSION_ID = data.data.id;
                objects.push(MasterObjectGuest);
                scene.add(objectGuest);
            }
            else {
                var index;
                for (index = 0; index < objects.length; index++) {
                    if (objects[index].SESSION_ID == data.data.id) {
                        objects[index].velocity = data.data.velocity;
                    }
                }
            }
        }
        //console.log(masterObject);
    });
    var SESSION_ID = parseInt(Math.random() * 1000);

    //Settings          
    var lambdaColision = 0.05;
    var colisionActive = false;
    var freeze = false;

    var width = window.innerWidth;
    var height = window.innerHeight;

    //THREE JS STUFF
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    var renderer = new THREE.WebGLRenderer();
    renderer.setSize(width, height);

    //GEOMETRIES
    var geometryCubeLevels = [
    new THREE.CubeGeometry(0.05, 0.05, 0.05),
    new THREE.CubeGeometry(0.1, 0.1, 0.1),
    new THREE.CubeGeometry(0.175, 0.175, 0.175),
    new THREE.CubeGeometry(0.20, 0.20, 0.20),
    new THREE.CubeGeometry(0.3, 0.3, 0.3)
    ];
    var geometrySphereLevels = [
    new THREE.SphereGeometry(0.05, 0.05, 0.05),
    new THREE.SphereGeometry(0.1, 0.1, 0.1),
    new THREE.SphereGeometry(0.15, 0.15, 0.15),
    new THREE.SphereGeometry(0.20, 0.20, 0.20),
    new THREE.SphereGeometry(0.3, 0.3, 0.3)
    ];

    var geometry = new THREE.CubeGeometry(0.4, 0.4, 0.4);
    var geometry2 = new THREE.SphereGeometry(0.2, 0.2, 0.2);

    //MATERIALS
    var material = new THREE.MeshNormalMaterial({
        color: 0x347896
    });
    var material2 = new THREE.MeshBasicMaterial({
        color: 0xcc00ff
    });
    var materialSpheres = new THREE.MeshLambertMaterial({
        color: 0x564390,
        shading: THREE.FlatShading,
        overdraw: false
    });



    document.body.appendChild(renderer.domElement);
    setTimeout(
        function () {
            colisionActive = true;
        }, 3000);

    var Utils = {
        checkColisionOnAxis: function (colisioner1, colisioner2, axis) {
            return Math.abs(colisioner1.object.position[axis] - colisioner2.object.position[axis]) < -0.155 + colisioner1.object.geometry.boundingSphere.radius * colisioner1.object.scale[axis] +
            colisioner2.object.geometry.boundingSphere.radius * colisioner2.object.scale[axis];
        },
        checkColisionOnAllAxis: function (colisioner1, colisioner2) {
            return Utils.checkColisionOnAxis(colisioner1, colisioner2, 'x') && Utils.checkColisionOnAxis(colisioner1, colisioner2, 'y') && Utils.checkColisionOnAxis(colisioner1, colisioner2, 'z');
        },
        getWeightDifference: function (colisioner1, colisioner2) {
            return colisioner1.object.geometry.boundingSphere.radius * (colisioner1.object.scale['z'] + colisioner1.object.scale['y'] + colisioner1.object.scale['x']) -
            colisioner2.object.geometry.boundingSphere.radius * (colisioner2.object.scale['z'] + colisioner2.object.scale['y'] + colisioner2.object.scale['x']);
        },
        checkSameWeight: function (colisioner1, colisioner2) {
            if ((Math.abs(Utils.getWeightDifference(colisioner1, colisioner2))) < 0.08)

                return true;
            return false;
        },
        getBiggerWeight: function (colisioner1, colisioner2) {
            if ((Utils.getWeightDifference(colisioner1, colisioner2)) < 0) {
                return colisioner1;
            }
            return colisioner2;
        }

    };


    //objects
    var objects = [];
    var numberOfObjects = 1;
    var getRandom = function () {
        var sign = parseInt(Math.random() * 100) % 2;
        if (sign == 0)
            sign = parseInt(Math.random() * 100) % 4;
        else
            sign = -parseInt(Math.random() * 100) % 4;
        var rand = Math.random() / 100 * sign;
        //console.log(rand);
        return rand * 2 + 0.0001;
    }

    /*OBJECT DEFINITION
    *
    **/
    var MovableObject = function (object, level) {
        var self = this;
        self.eatingBuffer = 0;
        self.SESSION_ID = SESSION_ID;
        self.object = object;
        self.object.castShadow = true;
        self.freeze = false;

        self.level = level || 0;
        self.buffer = 0;
        self.bufferOverflow = 5;

        var velocityClass = function () {
            var selfv = this;
            selfv.x = 0;
            selfv.y = 0;
            selfv.z = 0;
        };

        self.velocity = new velocityClass();
        self.resetRandom = function () {
            self.velocity.x = getRandom();
            self.velocity.y = getRandom();
            self.velocity.z = getRandom();
        };
        self.resetRandom();

        self.reflectSpeed = function (negative, axis) {
            self.velocity[axis] = Math.pow(-1, negative ? -1 : 1) * self.velocity[axis];
        };

        self.increaseBuffer = function (level) {
            var otherObject = self;
            otherObject.buffer += level;
            //console.log(level);
            if (otherObject.buffer > otherObject.bufferOverflow) {
                otherObject.level++;
                //console.log("inc");
                var epsilonScale = 0.2;
                otherObject.buffer = 0;
                otherObject.object.scale.x += epsilonScale;
                otherObject.object.scale.y += epsilonScale;
                otherObject.object.scale.z += epsilonScale;
            }
        }
        self.checkColision = function (otherObject) {
            if (self != otherObject && Utils.checkColisionOnAllAxis(self, otherObject)) {
                if (Utils.checkSameWeight(self, otherObject)) {
                    var v = self.velocity;
                    self.velocity = otherObject.velocity;
                    otherObject.velocity = v;
                }
                else {
                    var copy = otherObject;
                    otherObject = Utils.getBiggerWeight(self, otherObject);
                    if (self == otherObject) {
                        copy.increaseBuffer(self.level);
                    } else {
                        self.increaseBuffer(otherObject.level);
                    }

                    var ind = objects.indexOf(otherObject);
                    var index = 0;
                    for (index = 0; index < scene.__webglObjects.length; index++) {
                        if (scene.__webglObjects[index].object == otherObject.object) {
                            scene.remove(otherObject);
                            scene.__removeObject(otherObject);
                            scene.__webglObjects.splice(index, 1);
                            objects.splice(ind, 1);


                            if (objects.length == 1)
                                freeze = true;
                            break;
                        }
                    }
                }

            }
        }
    }

    //MASTER OBJECT

    var geometry3 = new THREE.SphereGeometry(0.275, 0.275, 0.275);
    var object = new THREE.Mesh(geometry3, material2);
    var masterObject = new MovableObject(object, 3);
    scene.add(object);
    objects.push(masterObject);

    var object = null;
    //GENERATE OBJECTS

    for (var k in geometryCubeLevels) {
        for (var j = 1; j < numberOfObjects - k; j++) {
            object = new THREE.Mesh(geometryCubeLevels[k], material);
            scene.add(object);
            objects.push(new MovableObject(object, k + 1));
        }
    }
    for (var z in geometrySphereLevels) {
        for (var j = 1; j < numberOfObjects - k; j++) {
            object = new THREE.Mesh(geometrySphereLevels[z], material);
            scene.add(object);
            objects.push(new MovableObject(object, k + 1));
        }
    }



    //SET CAMERA POSITION
    var aspectRatio = width / height;
    camera.position.y = 0//aspectRatio;
    camera.position.z = 8//aspectRatio+5;//aspectRatio;
    camera.position.x = 0//aspectRatio;


    var max = {};
    max.x = width / 110;
    max.z = aspectRatio / 2;
    max.y = height / 110;

    $("body").keydown(function (e) {
        var offset = 0.005;
        var key = e.which;
        if (key == 37) {
            masterObject.velocity.x -= offset;
        }
        if (key == 39) {
            masterObject.velocity.x += offset;
        }
        if (key == 38) {
            masterObject.velocity.y += offset;
        }
        if (key == 40) {
            masterObject.velocity.y -= offset;
        }
        socket.emit("client_keypress", { id: masterObject.SESSION_ID, velocity: masterObject.velocity });

    });

    var i = 0;
    var k = 0;

    //EXECUTES 60 TIMES A SECOND
    function render() {
        requestAnimationFrame(render);
        if (!freeze) {
            for (i = 0; i < objects.length; i++) {
                if (objects[i]) {
                    if (!objects[i].object.freeze) {

                        //check colision
                        if (colisionActive)
                            for (k = i + 1; k < objects.length; k++) {
                                objects[i].checkColision(objects[k]);
                            }

                        //velocity 
                        objects[i].object.position.x += objects[i].velocity.x;
                        if (Math.abs(objects[i].object.position.x) > max.x) {
                            objects[i].reflectSpeed(objects[i].object.position.x > 0, 'x');
                            //  objects[i].resetRandom();
                            //  objects[i].object.position.x=objects[i].velocity.x*3;
                        }

                        objects[i].object.position.y += objects[i].velocity.y;
                        if (Math.abs(objects[i].object.position.y) > max.y) {
                            objects[i].reflectSpeed(objects[i].object.position.y > 0, 'y');
                            // objects[i].resetRandom();
                            // objects[i].object.position.y=objects[i].velocity.y*3;
                        }

                        //objects[i].object.position.z+=objects[i].velocity.z;                    
                        if (Math.abs(objects[i].object.position.z) > max.z) {
                            //objects[i].reflectSpeed();
                            //objects[i].object.position.z=objects[i].velocity.z*3;
                        }

                        objects[i].object.rotation.x += objects[i].velocity.x;
                        objects[i].object.rotation.y += objects[i].velocity.y;
                        objects[i].object.rotation.z += objects[i].velocity.z;
                    }
                }
            }
            renderer.render(scene, camera);
        }
    }

    render();
});