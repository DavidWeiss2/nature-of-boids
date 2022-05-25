import "./p5.js";
import { Boid } from "./Boid.js";

const maxNumBoids = 1;

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
	for (let boid of boids) {
		boid.ai();
		boid.edges();
		boid.update();
		boid.show();
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