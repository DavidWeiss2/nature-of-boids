export class Boid {

    constructor(boidColor = null, x = random(window.innerWidth), y = random(window.innerHeight)) {
        this.color = boidColor;
        if (this.color === null) {
            this.color = color(random(255), random(255), random(255));
        }
        this.fear = map(this.color.levels[0], 0, 255, -1, 1);
        this.sight = map(this.color.levels[1], 0, 255, 0, 2);
        this.anger = map(this.color.levels[2], 0, 255, -1, 1);

        this.debug = false;
        this.pos = createVector(x, y);
        this.vel = createVector(1, 0);
        this.acc = createVector(0, 0);
        this.health = random(150);
        this.r = this.health / 6.25;
        this.perceptionRadius = (this.r * 5) * (this.sight);
        this.maxForce = this.health / 500;

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
        this.applyForce(this.wander(perceptionPoint));
    }

    pursueBoid(boidToPursue) {
        this.applyForce(this.pursue(boidToPursue,color(0,255,0)).mult(this.anger));
        if (this.pos.dist(boidToPursue.pos) < this.r ** 0.5) {
            this.health += boidToPursue.health / 10;
            boidToPursue.health = 0;
        }
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

    flock(boids) {
        if (!separationOnBoidsFromOtherSpecies.checked()) {
            boids = boids.filter((boid) => boid.myColor === this.myColor);
        }

        let alignment = this.align(boids, debug);
        let cohesion = this.cohesion(boids, debug);
        let separation = this.separation(boids, debug);

        alignment.mult(alignSlider.value());
        cohesion.mult(cohesionSlider.value());
        separation.mult(separationSlider.value());

        this.acceleration.add(alignment);
        this.acceleration.add(cohesion);
        this.acceleration.add(separation);
    }

    align(boids, debug = false) {
        let steering = createVector();
        let total = 0;
        this.flagsRGBforACS[0] = 0;
        for (let other of boids) {
            if (other.myColor != this.myColor) continue;
            let d = this.toroidalDistance(other.position);
            if (other != this && d < Boid.alignmentPerceptionRadius()) {
                let { dx, dy } = this.ShortestDxDy(other.position);
                let vec = createVector(dx, dy);
                if (
                    Math.abs(this.velocity.angleBetween(vec)) <
                    PerceptionDagreesSlider.value()
                ) {
                    steering.add(other.velocity);
                    total++;
                    if (debug) {
                        push();
                        stroke(0, 255, 0, alignSlider.value() * 100 + 30);
                        line(
                            this.position.x,
                            this.position.y,
                            this.position.x + vec.x,
                            this.position.y + vec.y
                        );
                        pop();
                    }
                    this.flagsRGBforACS[0] = 1;
                }
            }
        }
        if (total > 0) {
            steering.div(total);
            steering.setMag(Boid.maxSpeed);
            steering.sub(this.velocity);
            steering.limit(Boid.maxForce);
        }
        return steering;
    }

    separation(boids, debug = false) {
        let steering = createVector();
        let total = 0;
        this.flagsRGBforACS[2] = 0;
        for (let other of boids) {
            if (
                !separationOnBoidsFromOtherSpecies.checked() &&
                other.myColor != this.myColor
            )
                continue;
            let d = this.toroidalDistance(other.position);
            if (other != this && d < Boid.separationPerceptionRadius()) {
                let { dx, dy } = this.ShortestDxDy(other.position);
                let vec = createVector(dx, dy);
                if (
                    Math.abs(this.velocity.angleBetween(vec)) <
                    PerceptionDagreesSlider.value()
                ) {
                    let diff = p5.Vector.sub(this.position, other.position);
                    diff.div(d * d);
                    steering.add(diff);
                    total++;
                    if (debug) {
                        push();
                        stroke(255, 0, 0, separationSlider.value() * 100 + 30);
                        line(
                            this.position.x,
                            this.position.y,
                            this.position.x + vec.x,
                            this.position.y + vec.y
                        );
                        pop();
                    }
                    this.flagsRGBforACS[2] = 1;
                }
            }
        }
        if (total > 0) {
            steering.div(total);
            steering.setMag(Boid.maxSpeed);
            steering.sub(this.velocity);
            steering.limit(Boid.maxForce);
        }
        return steering;
    }

    cohesion(boids, debug = false) {
        let steering = createVector();
        let total = 0;
        this.flagsRGBforACS[1] = 0;
        for (let other of boids) {
            if (other.myColor != this.myColor) continue;

            let d = this.toroidalDistance(other.position);

            if (other != this && d < Boid.cohesionPerceptionRadius()) {
                let { dx, dy } = this.ShortestDxDy(other.position);
                let vec = createVector(dx, dy);
                if (
                    Math.abs(this.velocity.angleBetween(vec)) <
                    PerceptionDagreesSlider.value()
                ) {
                    steering.add(other.position);
                    total++;
                    if (debug) {
                        push();
                        stroke(0, 0, 255, cohesionSlider.value() * 100 + 30);
                        line(
                            this.position.x,
                            this.position.y,
                            this.position.x + vec.x,
                            this.position.y + vec.y
                        );
                        pop();
                    }
                    this.flagsRGBforACS[1] = 1;
                }
            }
        }
        if (total > 0) {
            steering.div(total);
            steering.sub(this.position);
            steering.setMag(Boid.maxSpeed);
            steering.sub(this.velocity);
            steering.limit(Boid.maxForce);
        }
        return steering;
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
        let pursuit = this.pursue(boid,color(255,0,0));
        pursuit.mult(-1);
        return pursuit;
    }

    pursue(boid,draw=null) {
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

    update() {
        this.drag();
        this.vel.add(this.acc);
        this.pos.add(this.vel);
        this.acc.set(0, 0);
        this.r = this.health / 6.25;
        this.perceptionRadius = (this.r * 5) * (this.sight);
        this.maxForce = this.health / 500;
    }

    show() {
        stroke(this.color);
        strokeWeight(2);
        fill(this.color);
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