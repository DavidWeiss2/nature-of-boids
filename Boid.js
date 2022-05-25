export class Boid {

    constructor(x = random(window.innerWidth), y = random(window.innerHeight)) {
        this.debug = false;
        this.pos = createVector(x, y);
        this.vel = createVector(1, 0);
        this.acc = createVector(0, 0);
        this.maxForce = 0.2;
        this.health = random(50, 150);
        this.r = this.health / 6.25;
        this.perceptionRadius = this.r * 5;

        this.wanderTheta = PI / 2;
    }

    ai(avoid, seek) {
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
                this.applyForce(this.evade(avoid[i]));
                forceWasApplied = true;
                if (this.debug) {
                    fill(255, 0, 0);
                    noStroke();
                    circle(avoid[i].pos.x, avoid[i].pos.y, 16);

                    stroke(255, 0, 0);
                    line(this.pos.x, this.pos.y, avoid[i].pos.x, avoid[i].pos.y);
                }
            }
        }
        if (seek.length > 0) {
            for (let i = 0; i < seek.length; i++) {
                if (perceptionPoint.dist(seek[i].pos) > this.perceptionRadius * 1.5) continue;
                this.applyForce(this.pursue(seek[i]));
                if (this.pos.dist(seek[i].pos) < this.r ** 0.5) {
                    this.health += seek[i].health / 10;
                    seek[i].health = 0;
                }
                if (this.debug) {
                    fill(0, 255, 0);
                    noStroke();
                    circle(seek[i].pos.x, seek[i].pos.y, 16);

                    stroke(0, 255, 0);
                    line(this.pos.x, this.pos.y, seek[i].pos.x, seek[i].pos.y);
                }
                forceWasApplied = true;
                break;
            }
        }
        if (forceWasApplied) return;
        this.applyForce(this.wander(perceptionPoint));
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

        let steer = perceptionPoint.sub(this.pos);
        let steerMag = map(steer.mag(), 0, this.perceptionRadius * 2, 0, this.maxForce)
        steer.setMag(steerMag);

        let displaceRange = 0.3;
        this.wanderTheta += random(-displaceRange, displaceRange);
        return steer;
    }



    seek(target, arrival = false) {
        let force = p5.Vector.sub(target, this.pos);
        let desiredSpeed = this.r / 4;
        if (arrival) {
            let slowRadius = this.perceptionRadius;
            let distance = force.mag();
            if (distance < slowRadius) {
                desiredSpeed = map(distance, 0, slowRadius, 0, this.vel);
            }
        }
        force.setMag(desiredSpeed);
        force.sub(this.vel);
        force.limit(this.maxForce);
        return force;
    }

    evade(boid) {
        let pursuit = this.pursue(boid);
        pursuit.mult(-1);
        return pursuit;
    }

    pursue(boid) {
        let target = boid.pos.copy();
        let prediction = boid.vel.copy();
        prediction.mult(10);
        target.add(prediction);
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
        drag.setMag(this.health / 10000 * speedSq);
        this.applyForce(drag);
    }

    update() {
        this.drag();
        this.vel.add(this.acc);
        this.pos.add(this.vel);
        this.acc.set(0, 0);
        this.r = this.health / 6.25;
        this.perceptionRadius = this.r * 5;
    }

    show() {
        stroke(255);
        strokeWeight(2);
        fill(255);
        push();
        translate(this.pos.x, this.pos.y);
        rotate(this.vel.heading());
        triangle(-this.r * 2, -this.r / 2, -this.r * 2, this.r / 2, 0, 0);
        pop();
    }

    edges() {
        if (this.pos.x > width + this.r) {
            this.pos.x = -this.r;
        } else if (this.pos.x < -this.r) {
            this.pos.x = width + this.r;
        }
        if (this.pos.y > height + this.r) {
            this.pos.y = -this.r;
        } else if (this.pos.y < -this.r) {
            this.pos.y = height + this.r;
        }
    }
}