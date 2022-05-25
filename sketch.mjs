import "./p5.js";
import { Boid } from "./Boid.js";

const maxNumBoids = 30;

let width = window.innerWidth;
let height = window.innerHeight;
let canvasArea = width * height;

const boids = [];

window.setup = function () {
	createCanvas(width, height);
	background(0);
	for (let i = 0; i < maxNumBoids; i++) {
		boids.push(new Boid());
	};
};

window.draw = function () {
	background(0);
	for (let i = boids.length; i--;) {
		boids[i].ai(boids.slice(0, i), boids.slice(i + 1, boids.length));
		boids[i].edges();
		boids[i].update();
		boids[i].show();
		if(boids[i].health <= 0) {
			boids.splice(i, 1);
			// boids.push(new Boid());
			console.log('one down')
		}
	}
};

window.keyReleased = function () {
	if (keyCode === ENTER) {
		debug = !debug;
	}
};

window.onresize = function () {
	width = window.innerWidth;
	height = window.innerHeight;
	canvasArea = width * height;
	resizeCanvas(width, height);
}

document.oncontextmenu = function () {
	return false;
}