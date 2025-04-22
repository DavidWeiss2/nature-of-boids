import { becomeFoodAt, debug, foodSize } from "./sketch.mjs";

let oldestBoid = null;

export class Boid {
    constructor(boidColor = null, x = random(window.innerWidth), y = random(window.innerHeight)) {
        this.color = boidColor;
        if (this.color === null) {
            this.color = color(random(255), random(255), random(255));
        }
        this.fear = map(this.color.levels[0], 0, 255, 0.1, 1);
        this.sight = map(this.color.levels[1], 0, 255, 0.5, 2);
        this.anger = map(this.color.levels[2], 0, 255, 0.1, 1);

        this.debug = false;
        this.pos = createVector(x, y);
        this.vel = createVector(1, 0);
        this.acc = createVector(0, 0);
        this.health = random(150) + 1;
        this.r = this.health / 6.25;
        this.perceptionRadius = (this.r * 10) * (this.sight);
        this.maxForce = this.health / 500;
        this.maxSpeed = 3;

        this.wanderTheta = PI / 2;
        this.mesh = { head: createVector(0, 0), left: createVector(-this.r * 2, -this.r / 2), right: createVector(-this.r * 2, this.r / 2) };
        this.birthDate = new Date();
        // this.mesh = { head: { x: 0, y: 0 }, left: { x: -this.r * 2, y: -this.r / 2 }, right: { x: -this.r * 2, y: this.r / 2 } };
    }

    ai(avoid, seek, flock) {
        let perceptionPoint = this.vel.copy();
        perceptionPoint.setMag(this.perceptionRadius);
        perceptionPoint.add(this.pos);

        if (this.debug) {
            noFill();
            stroke(255);
            circle(perceptionPoint.x, perceptionPoint.y, this.perceptionRadius * 2);
            stroke(0, 255, 0);
            circle(perceptionPoint.x, perceptionPoint.y, this.perceptionRadius * 2 * 1.5);
            stroke(255, 0, 0);
            circle(this.pos.x, this.pos.y, this.perceptionRadius * 2 * 2);
        }
        let forceWasApplied = false;

        if (avoid.length > 0) {
            for (let i = 0; i < avoid.length; i++) {
                if (this.pos.dist(avoid[i].pos) > this.perceptionRadius * 2) continue;
                this.applyForce(this.evade(avoid[i]).mult(this.fear));
                forceWasApplied = true;
            }
        }
        if (seek.length > 0) {
            let closest = -1;
            for (let i = 0; i < seek.length; i++) {
                if (perceptionPoint.dist(seek[i].pos) > this.perceptionRadius * 1.5) continue;
                if (closest == -1 || this.pos.dist(seek[i].pos) < this.pos.dist(seek[closest].pos)) {
                    closest = i;
                }
            }
            if (closest != -1) {
                const boidToPursue = seek[closest];
                this.pursueBoid(boidToPursue);
                forceWasApplied = true;
            }
        }
        if (forceWasApplied) return;
        if (flock.length > 0) {
            this.flock(flock, this.debug);
        } else {
            this.applyForce(this.wander(perceptionPoint));
        }
    }

    pursueBoid(boidToPursue) {
        const isSameColor = this.color?.toString() === boidToPursue.color?.toString();
        if (boidToPursue.health <= becomeFoodAt && !isSameColor) {
            this.applyForce(this.arrive(boidToPursue.pos).mult(this.anger));
            if (this.pos.dist(boidToPursue.pos) < foodSize) {
                this.health += boidToPursue.health;
                this.health = min(this.health, min(width, height));
                boidToPursue.health = 0;
            }
            return;
        }
        if (this.isTouching(boidToPursue) && !isSameColor) {
            this.health += max(boidToPursue.health / 10, becomeFoodAt);
            this.health = min(this.health, min(width, height));
            boidToPursue.health = 0;
            return;
        }
        this.applyForce(this.pursue(boidToPursue, color(0, 255, 0)).mult(this.anger));
    }

    wander(perceptionPoint) {
        let theta = this.wanderTheta + this.vel.heading();
        let x = this.perceptionRadius * cos(theta);
        let y = this.perceptionRadius * sin(theta);
        perceptionPoint.add(x, y);

        if (this.debug) {
            fill(0, 255, 0);
            noStroke();
            circle(perceptionPoint.x, perceptionPoint.y, 16);

            stroke(255);
            line(this.pos.x, this.pos.y, perceptionPoint.x, perceptionPoint.y);
        }

        let displaceRange = 0.3;
        this.wanderTheta += random(-displaceRange, displaceRange);
        return this.arrive(perceptionPoint);
    }

    flock(boids, debug) {
        // Filter boids to only include those of the same color
        const biggerBoids = boids.filter(other => other.health > this.health);
        const smallerBoids = boids.filter(other => other.health < this.health);
        this.ai(smallerBoids, biggerBoids,[]);
    }

    seek(target, arrival = false) {
        let force = p5.Vector.sub(target, this.pos);
        let desiredSpeed = this.r / 4;
        if (arrival) {
            let slowRadius = this.perceptionRadius;
            let distance = force.mag();
            if (distance < slowRadius) {
                desiredSpeed = map(distance, 0.00001, slowRadius, desiredSpeed / 5, desiredSpeed);
            }
        }
        force.setMag(desiredSpeed);
        force.sub(this.vel);
        console.log(force.mag(), this.maxForce, { ...this });
        force.limit(this.maxForce);
        return force;
    }

    evade(boid) {
        let pursuit = this.pursue(boid, color(255, 0, 0));
        pursuit.mult(-1);
        return pursuit;
    }

    pursue(boid, draw = null) {
        let target = boid.pos.copy();
        let prediction = boid.vel.copy();
        prediction.mult(10);
        target.add(prediction);
        if (draw && this.debug) {
            push();
            fill(draw);
            noStroke();
            circle(target.x, target.y, 3);
            stroke(draw);
            line(this.pos.x, this.pos.y, target.x, target.y);
            pop();
        }
        return this.seek(target);
    }

    arrive(target) {
        // 2nd argument true enables the arrival behavior
        return this.seek(target, true);
    }

    flee(target) {
        return this.seek(target).mult(-1);
    }

    applyForce(force) {
        this.acc.add(force);
    }

    drag() {
        let drag = this.vel.copy();
        drag.normalize();
        drag.mult(-1);
        let speedSq = this.vel.magSq();
        drag.setMag(Math.min(this.health / 10000 * speedSq), 0.001);
        this.applyForce(drag);
    }

    distance(other) {

    }


    update() {
        this.drag();
        this.vel.add(this.acc);
        this.pos.add(this.vel);
        this.acc.set(0, 0);
        if (this.health) {
            this.r = this.health / 6.25;
            this.perceptionRadius = (this.r + 45) * (this.sight);
            this.maxForce = this.health / 500;
        }
        if (!oldestBoid || oldestBoid.health <= becomeFoodAt) {
            oldestBoid = this;
            return;
        }
        if (this.birthDate < oldestBoid.birthDate) {
            oldestBoid.debug = false;
            oldestBoid = this;
            return;
        }
        if (this.color === oldestBoid.color) this.debug = debug;
    }

    show() {
        stroke(this.color);
        if (this === oldestBoid) stroke(255);
        strokeWeight(2);
        fill(this.color);
        push();
        translate(this.pos.x, this.pos.y);
        rotate(this.vel.heading());
        triangle(this.mesh.left.x, this.mesh.left.y, this.mesh.right.x, this.mesh.right.y, this.mesh.head.x, this.mesh.head.y);
        pop();
    }

    edges() {
        if (this.pos.x > width + this.r) {
            this.pos.x = this.r;
        } else if (this.pos.x < -this.r) {
            this.pos.x = width - this.r;
        }
        if (this.pos.y > height + this.r) {
            this.pos.y = this.r;
        } else if (this.pos.y < -this.r) {
            this.pos.y = height - this.r;
        }
    }

    isTouching(boid) {
        const myMeshWithpos = getMeshInLocation(this);
        const otherMeshWithpos = getMeshInLocation(boid);

        for (let v = 0; v < myMeshWithpos.length; v++) {
            const from = myMeshWithpos[v];
            const to = myMeshWithpos[(v + 1) % myMeshWithpos.length]
            for (let v = 0; v < myMeshWithpos.length; v++) {
                const boidFrom = otherMeshWithpos[v];
                const boidTo = otherMeshWithpos[(v + 1) % myMeshWithpos.length];
                if (isIntersects(from.x, from.y, to.x, to.y, boidFrom.x, boidFrom.y, boidTo.x, boidTo.y)) return true;
            }
        }
        return false;

        function getMeshInLocation(boid) {
            let meshWithpos = [];
            for (let v = 0; v < Object.keys(boid.mesh).length; v++) {
                meshWithpos.push(Object.values(boid.mesh)[v].copy());
                meshWithpos[v].add(boid.pos);
                const cos = Math.cos(boid.vel.heading());
                const sin = Math.sin(boid.vel.heading());
                const origin = boid.pos;
                const point = meshWithpos[v];

                meshWithpos[v] = createVector(
                    (cos * (point.x - origin.x)) - (sin * (point.y - origin.y)) + origin.x,
                    (cos * (point.y - origin.y)) + (sin * (point.x - origin.x)) + origin.y
                );
            }
            return meshWithpos;
        }

        function isIntersects(a, b, c, d, p, q, r, s) {
            var det, gamma, lambda;
            det = (c - a) * (s - q) - (r - p) * (d - b);
            if (det === 0) {
                return false;
            } else {
                lambda = ((s - q) * (r - a) + (p - r) * (s - b)) / det;
                gamma = ((b - d) * (r - a) + (c - a) * (s - b)) / det;
                return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
            }
        };
    }
}
