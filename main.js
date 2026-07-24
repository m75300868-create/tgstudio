import * as THREE from 'three';
        import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

        const container = document.getElementById('three-container');
        const morphNameEl = document.getElementById('morph-name');
        const morphCounterEl = document.getElementById('morph-counter');
        const dots = document.querySelectorAll('.dot-nav');

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 2.5;
        renderer.powerPreference = 'high-performance';
        container.appendChild(renderer.domElement);

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0e0e0e);
        scene.fog = new THREE.FogExp2(0x0e0e0e, 0.02);

        const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 100);
        camera.position.set(0, 0, 5);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.04;
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.4;
        controls.enableZoom = false;
        controls.enablePan = false;

        const ambient = new THREE.AmbientLight(0xffeedd, 3);
        scene.add(ambient);
        const keyLight = new THREE.PointLight(0xc4a882, 15, 50);
        keyLight.position.set(3, 3, 4);
        scene.add(keyLight);
        const fillLight = new THREE.PointLight(0x4a6fa5, 8, 50);
        fillLight.position.set(-4, -2, 3);
        scene.add(fillLight);
        const rimLight = new THREE.PointLight(0x8b7355, 10, 50);
        rimLight.position.set(0, 4, -3);
        scene.add(rimLight);
        const frontLight = new THREE.PointLight(0xffffff, 12, 40);
        frontLight.position.set(0, 0, 6);
        scene.add(frontLight);
        const bottomLight = new THREE.PointLight(0xc4a882, 8, 40);
        bottomLight.position.set(0, -3, 3);
        scene.add(bottomLight);

        const PARTICLE_COUNT = 25000;
        const shapes = [];
        const shapeNames = ['Dodeca', 'Heart', 'Diamond', 'Helix'];

        function sampleGeometry(geometry, count) {
            const pos = new Float32Array(count * 3);
            const posAttr = geometry.attributes.position;
            const indexAttr = geometry.index;
            const triangles = [];
            const triCount = indexAttr ? indexAttr.count / 3 : posAttr.count / 3;
            const vA = new THREE.Vector3(), vB = new THREE.Vector3(), vC = new THREE.Vector3();
            const areas = [];
            let totalArea = 0;
            for (let i = 0; i < triCount; i++) {
                let a, b, c;
                if (indexAttr) { a = indexAttr.getX(i*3); b = indexAttr.getX(i*3+1); c = indexAttr.getX(i*3+2); }
                else { a = i*3; b = i*3+1; c = i*3+2; }
                vA.fromBufferAttribute(posAttr, a);
                vB.fromBufferAttribute(posAttr, b);
                vC.fromBufferAttribute(posAttr, c);
                const area = new THREE.Triangle(vA.clone(), vB.clone(), vC.clone()).getArea();
                areas.push(area); totalArea += area;
                triangles.push([vA.clone(), vB.clone(), vC.clone()]);
            }
            for (let i = 0; i < count; i++) {
                let r = Math.random() * totalArea;
                let triIdx = 0;
                for (let j = 0; j < areas.length; j++) { r -= areas[j]; if (r <= 0) { triIdx = j; break; } }
                const tri = triangles[triIdx];
                let u = Math.random(), v = Math.random();
                if (u + v > 1) { u = 1-u; v = 1-v; }
                const w = 1-u-v;
                pos[i*3]   = tri[0].x*w + tri[1].x*u + tri[2].x*v;
                pos[i*3+1] = tri[0].y*w + tri[1].y*u + tri[2].y*v;
                pos[i*3+2] = tri[0].z*w + tri[1].z*u + tri[2].z*v;
            }
            return pos;
        }

        function makeSkull() {
            const geo = new THREE.DodecahedronGeometry(1.2, 1);
            const nonIdx = geo.toNonIndexed();
            const idxGeo = new THREE.BufferGeometry();
            idxGeo.setAttribute('position', nonIdx.attributes.position);
            const idxArr = [];
            for (let i = 0; i < nonIdx.attributes.position.count; i++) idxArr.push(i);
            idxGeo.setIndex(idxArr);
            return sampleGeometry(idxGeo, PARTICLE_COUNT);
        }

        function makeHeart() {
            const pos = new Float32Array(PARTICLE_COUNT * 3);
            for (let i = 0; i < PARTICLE_COUNT; i++) {
                const t = Math.random() * Math.PI * 2;
                const s = Math.random() * Math.PI;
                const scatter = 0.03;
                const heartX = 16 * Math.pow(Math.sin(t), 3) / 16;
                const heartY = (13*Math.cos(t) - 5*Math.cos(2*t) - 2*Math.cos(3*t) - Math.cos(4*t)) / 16;
                const depth = Math.sin(s) * 0.5;
                pos[i*3]   = heartX + (Math.random()-0.5)*scatter;
                pos[i*3+1] = heartY + (Math.random()-0.5)*scatter;
                pos[i*3+2] = depth  + (Math.random()-0.5)*scatter;
            }
            return pos;
        }

        function makeDiamond() {
            const yOffset = 0.35;
            const topGeo = new THREE.ConeGeometry(1.4, 0.9, 8);
            topGeo.translate(0, 0.45+yOffset, 0);
            const bottomGeo = new THREE.ConeGeometry(1.4, 2.0, 8);
            bottomGeo.rotateX(Math.PI);
            bottomGeo.translate(0, -1.0+yOffset, 0);
            const topNonIdx = topGeo.toNonIndexed();
            const botNonIdx = bottomGeo.toNonIndexed();
            const topIdxGeo = new THREE.BufferGeometry();
            topIdxGeo.setAttribute('position', topNonIdx.attributes.position);
            const topIdx = []; for (let i = 0; i < topNonIdx.attributes.position.count; i++) topIdx.push(i);
            topIdxGeo.setIndex(topIdx);
            const botIdxGeo = new THREE.BufferGeometry();
            botIdxGeo.setAttribute('position', botNonIdx.attributes.position);
            const botIdx = []; for (let i = 0; i < botNonIdx.attributes.position.count; i++) botIdx.push(i);
            botIdxGeo.setIndex(botIdx);
            const topCount = Math.floor(PARTICLE_COUNT * 0.4);
            const botCount = PARTICLE_COUNT - topCount;
            const topPts = sampleGeometry(topIdxGeo, topCount);
            const botPts = sampleGeometry(botIdxGeo, botCount);
            const pos = new Float32Array(PARTICLE_COUNT * 3);
            pos.set(topPts);
            for (let i = 0; i < botCount*3; i++) pos[topCount*3+i] = botPts[i];
            return pos;
        }

        function makeHelix() {
            const pos = new Float32Array(PARTICLE_COUNT * 3);
            const helixCount = PARTICLE_COUNT / 2;
            for (let h = 0; h < 2; h++) {
                const offset = h * Math.PI;
                for (let i = 0; i < helixCount; i++) {
                    const idx = (h*helixCount+i)*3;
                    const t = (i/helixCount)*Math.PI*6 - Math.PI*3;
                    const r = 0.6;
                    pos[idx]   = r*Math.cos(t+offset) + (Math.random()-0.5)*0.04;
                    pos[idx+1] = t*0.25 + (Math.random()-0.5)*0.04;
                    pos[idx+2] = r*Math.sin(t+offset) + (Math.random()-0.5)*0.04;
                    if (i % 200 < 10 && h === 0) {
                        const rungT = Math.floor(i/200)*200;
                        const rungAngle = (rungT/helixCount)*Math.PI*6 - Math.PI*3;
                        const frac = (i%200)/10;
                        pos[idx]   = r*Math.cos(rungAngle)*(1-frac) + r*Math.cos(rungAngle+Math.PI)*frac;
                        pos[idx+2] = r*Math.sin(rungAngle)*(1-frac) + r*Math.sin(rungAngle+Math.PI)*frac;
                    }
                }
            }
            return pos;
        }

        shapes.push(makeSkull());
        shapes.push(makeHeart());
        shapes.push(makeDiamond());
        shapes.push(makeHelix());

        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(PARTICLE_COUNT * 3);
        const colors    = new Float32Array(PARTICLE_COUNT * 3);
        const sizes     = new Float32Array(PARTICLE_COUNT);
        const randoms   = new Float32Array(PARTICLE_COUNT);

        positions.set(shapes[0]);

        const c1 = new THREE.Color(0xf0d9b5);
        const c2 = new THREE.Color(0xd4a574);
        const c3 = new THREE.Color(0x7eb8e0);

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const ratio = i / PARTICLE_COUNT;
            const color = ratio < 0.5
                ? c1.clone().lerp(c2, ratio*2)
                : c2.clone().lerp(c3, (ratio-0.5)*2);
            colors[i*3]   = color.r;
            colors[i*3+1] = color.g;
            colors[i*3+2] = color.b;
            sizes[i]   = 0.012 + Math.random()*0.02;
            randoms[i] = Math.random();
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color',    new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('aSize',    new THREE.BufferAttribute(sizes, 1));
        geometry.setAttribute('aRandom',  new THREE.BufferAttribute(randoms, 1));

        const material = new THREE.ShaderMaterial({
            uniforms: {
                uTime:        { value: 0 },
                uPixelRatio:  { value: renderer.getPixelRatio() },
                uMorph:       { value: 0 },
                uMouse3D:     { value: new THREE.Vector3(0,0,0) },
                uMouseActive: { value: 0 },
            },
            vertexShader: `
                attribute float aSize;
                attribute float aRandom;
                varying vec3 vColor;
                varying float vAlpha;
                uniform float uTime;
                uniform float uPixelRatio;
                uniform float uMorph;
                uniform vec3 uMouse3D;
                uniform float uMouseActive;

                void main() {
                    vColor = color;
                    vec3 pos = position;
                    float breath = sin(uTime * 0.5 + aRandom * 6.28) * 0.02;
                    pos += normalize(pos) * breath;
                    float scatter = sin(uMorph * 3.14159) * 0.3;
                    pos += normalize(pos + vec3(0.001)) * scatter * aRandom;
                    vec3 toParticle = pos - uMouse3D;
                    float xyDist = length(toParticle.xy);
                    float fullDist = length(toParticle);
                    float mouseRadius = 1.4;
                    float influence = 1.0 - smoothstep(0.0, mouseRadius, xyDist);
                    influence = influence * influence * uMouseActive;
                    if (influence > 0.001) {
                        vec3 pushDir = fullDist > 0.001 ? normalize(toParticle) : vec3(0.0, 1.0, 0.0);
                        pos += pushDir * influence * 0.3;
                        float swirlSpeed = uTime * 2.0 + aRandom * 6.28;
                        float swirlStrength = influence * 0.25;
                        vec2 radial = pos.xy - uMouse3D.xy;
                        float angle = swirlStrength * (1.0 + sin(swirlSpeed) * 0.3);
                        float cosA = cos(angle); float sinA = sin(angle);
                        vec2 rotated = vec2(radial.x*cosA - radial.y*sinA, radial.x*sinA + radial.y*cosA);
                        pos.xy = uMouse3D.xy + rotated;
                        pos.z += sin(swirlSpeed*0.7 + aRandom*3.14) * influence * 0.15;
                        pos += pushDir * sin(uTime*4.0 + aRandom*18.0) * 0.02 * influence;
                    }
                    vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
                    gl_PointSize = aSize * uPixelRatio * 500.0 / -mvPos.z;
                    gl_PointSize = max(gl_PointSize, 1.5);
                    gl_Position = projectionMatrix * mvPos;
                    vAlpha = 0.85 + 0.15 * (1.0 - smoothstep(0.0, 10.0, -mvPos.z));
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                varying float vAlpha;
                void main() {
                    float d = length(gl_PointCoord - vec2(0.5));
                    if (d > 0.5) discard;
                    float alpha = smoothstep(0.5, 0.0, d) * vAlpha;
                    vec3 brightColor = vColor * 2.2 + 0.15;
                    gl_FragColor = vec4(brightColor, alpha);
                }
            `,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            vertexColors: true,
        });

        const particles = new THREE.Points(geometry, material);
        scene.add(particles);

        let currentShape = 0, targetShape = 0;
        let morphProgress = 0, isMorphing = false;
        const morphDuration = 2.5;
        let morphStartTime = 0;
        const clock = new THREE.Clock();

        function startMorph(targetIdx) {
            if (isMorphing || targetIdx === currentShape) return;
            targetShape = targetIdx;
            isMorphing = true;
            morphStartTime = clock.getElapsedTime();
        }

        const morphProgressEl = document.getElementById('morph-progress');
        const morphInterval = 5;

        let autoMorphInterval = setInterval(() => {
            startMorph((currentShape + 1) % shapes.length);
        }, 5000);

        dots.forEach(dot => {
            dot.addEventListener('click', () => {
                clearInterval(autoMorphInterval);
                startMorph(parseInt(dot.dataset.idx));
                autoMorphInterval = setInterval(() => startMorph((currentShape+1) % shapes.length), 5000);
            });
        });

        function updateUI(idx) {
            morphNameEl.textContent = shapeNames[idx];
            morphCounterEl.textContent = `0${idx+1} / 0${shapes.length}`;
            dots.forEach((d,i) => d.classList.toggle('active', i === idx));
        }

        const raycaster = new THREE.Raycaster();
        const mouseNDC = new THREE.Vector2(9999, 9999);
        const mousePlane = new THREE.Plane(new THREE.Vector3(0,0,1), 0);
        const mouse3D = new THREE.Vector3();
        let mouseOnScreen = false;
        let mouseActiveSmooth = 0;

        document.addEventListener('mousemove', (e) => {
            mouseNDC.x = (e.clientX / window.innerWidth)*2 - 1;
            mouseNDC.y = -(e.clientY / window.innerHeight)*2 + 1;
            mouseOnScreen = true;
        });
        document.addEventListener('mouseleave', () => { mouseNDC.set(9999,9999); mouseOnScreen = false; });

        const _invMatrix = new THREE.Matrix4();
        const _localMouse = new THREE.Vector3();
        const _intersectPoint = new THREE.Vector3();

        function easeInOutCubic(t) {
            return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2;
        }

        let lastUIUpdate = -1;

        function animate() {
            requestAnimationFrame(animate);
            controls.update();
            const elapsed = clock.getElapsedTime();
            material.uniforms.uTime.value = elapsed;

            mouseActiveSmooth += ((mouseOnScreen ? 1 : 0) - mouseActiveSmooth) * 0.08;
            material.uniforms.uMouseActive.value = mouseActiveSmooth;

            raycaster.setFromCamera(mouseNDC, camera);
            raycaster.ray.intersectPlane(mousePlane, _intersectPoint);
            _invMatrix.copy(particles.matrixWorld).invert();
            _localMouse.copy(_intersectPoint).applyMatrix4(_invMatrix);
            material.uniforms.uMouse3D.value.copy(_localMouse);

            if (isMorphing) {
                const rawProgress = Math.min((elapsed - morphStartTime) / morphDuration, 1);
                morphProgress = easeInOutCubic(rawProgress);
                material.uniforms.uMorph.value = morphProgress;
                const src = shapes[currentShape];
                const tgt = shapes[targetShape];
                const posArray = geometry.attributes.position.array;
                const len = PARTICLE_COUNT * 3;
                for (let i = 0; i < len; i++) posArray[i] = src[i] + (tgt[i]-src[i]) * morphProgress;
                geometry.attributes.position.needsUpdate = true;
                if (rawProgress >= 1) {
                    isMorphing = false;
                    currentShape = targetShape;
                    material.uniforms.uMorph.value = 0;
                    updateUI(currentShape);
                    lastUIUpdate = -1;
                }
                if (rawProgress > 0.4 && rawProgress < 0.6 && lastUIUpdate !== targetShape) {
                    lastUIUpdate = targetShape;
                    updateUI(targetShape);
                }
            }

            particles.rotation.y = elapsed * 0.05;
            particles.position.y = Math.sin(elapsed * 0.3) * 0.05;

            const sinT = Math.sin(elapsed*0.2);
            const cosT = Math.cos(elapsed*0.2);
            keyLight.position.x = sinT*4;
            keyLight.position.z = cosT*4;

            if (!isMorphing && morphProgressEl)
                morphProgressEl.style.width = ((elapsed % morphInterval) / morphInterval * 100) + '%';
            else if (morphProgressEl)
                morphProgressEl.style.width = '0%';

            renderer.render(scene, camera);
        }

        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            material.uniforms.uPixelRatio.value = renderer.getPixelRatio();
        });

        animate();

const blurLayer = document.querySelector('.layer-blur');
        let mouseX = window.innerWidth/2, mouseY = window.innerHeight/2;
        let smoothX = mouseX, smoothY = mouseY;
        let lastBX = '', lastBY = '';
        document.addEventListener('mousemove', (e) => { mouseX = e.clientX; mouseY = e.clientY; });
        (function animateBlur() {
            smoothX += (mouseX - smoothX) * 0.1;
            smoothY += (mouseY - smoothY) * 0.1;
            const nx = (smoothX/window.innerWidth*100).toFixed(1)+'%';
            const ny = (smoothY/window.innerHeight*100).toFixed(1)+'%';
            if (nx !== lastBX || ny !== lastBY) {
                lastBX = nx; lastBY = ny;
                blurLayer.style.setProperty('--x', nx);
                blurLayer.style.setProperty('--y', ny);
            }
            requestAnimationFrame(animateBlur);
        })();

const translations = {
            en: {
                // Nav
                navAbout: 'About', navPortfolio: 'Portfolio', navFaq: 'FAQ',
                navWhy: 'Why Us', navCta: 'Get in Touch →', navCta2: 'Contact',
                // Hero
                heroBadge: 'AI • DESIGN • WEB', heroLine1: 'Welcome to',
                heroAccent: 'Where Ideas Become Reality.',
                heroCta1: 'View Portfolio', heroCta2: "Let's Talk",
                heroFooterAvail: 'Available for projects',
                // About
                aboutKicker: '// About',
                aboutTitle: 'Crafting <em>Digital Experiences</em>',
                aboutIntro: 'I\'m Todor — a creative director and AI specialist based in Serbia, helping brands worldwide communicate with precision, beauty, and impact.',
                aboutDesc: 'From concept to launch — AI production, graphic design, and web development delivered as one seamless premium experience.',
                aboutExpertiseLabel: 'Expertise',
                aboutPill1: 'AI Production', aboutPill2: 'Web Development',
                aboutPill3: 'Graphic Design', aboutPill4: 'Brand Strategy',
                aboutCta: 'Start a Project →', portraitRole: 'Creative Director & AI Specialist',
                // Portfolio
                portfolioKicker: '// Portfolio',
                portfolioTitle: 'Work That <em>Speaks</em>',
                card1Title: 'AI Photo Production',
                card1Desc: 'Luxury AI-generated photography, advertising visuals, editorial campaigns, product renders, and social media content.',
                card1Tag1: 'Editorial', card1Tag2: 'Advertising', card1Tag3: 'Product Renders', card1Tag4: 'Social Content',
                card2Title: 'AI Video Production',
                card2Desc: 'Cinematic AI videos, commercials, product showcases, promotional videos, social media reels, and storytelling.',
                card2Tag1: 'Commercials', card2Tag2: 'Showcases', card2Tag3: 'Reels', card2Tag4: 'Storytelling',
                card3Title: 'Graphic Design',
                card3Desc: 'Brand identity, posters, social media design, thumbnails, packaging, visual systems, and premium marketing materials.',
                card3Tag1: 'Brand Identity', card3Tag2: 'Posters', card3Tag3: 'Packaging', card3Tag4: 'Visual Systems',
                card4Title: 'Web Development',
                card4Desc: 'Modern websites, landing pages, business websites, portfolios, UI/UX design, and high-converting digital experiences.',
                card4Tag1: 'Landing Pages', card4Tag2: 'UI/UX', card4Tag3: 'Portfolios', card4Tag4: 'E-Commerce',
                // FAQ
                faqKicker: '// FAQ',
                faqTitle: 'Frequently Asked <em>Questions</em>',
                faq1Q: 'How long does a project take?',
                faq1A: 'Every project is different. Delivery time depends on its complexity, scope, and specific requirements.',
                faq2Q: 'How much does a project cost?',
                faq2A: 'Pricing depends on the project size, complexity, and the services required.',
                faq3Q: 'Do you work internationally?',
                faq3A: 'Yes. I work with clients worldwide and provide remote collaboration for all services.',
                faq4Q: 'Can you create custom AI content for my brand?',
                faq4A: 'Absolutely. Every project is tailored specifically to your brand identity and goals.',
                faq5Q: 'Can I combine multiple services?',
                faq5A: 'Yes. Many clients combine AI production, branding, design, and web development into one complete solution.',
                // Why
                whyKicker: '// Why Us',
                whyTitle: 'Why choose <em>TG Studio?</em>',
                whyIntro1: 'Ideas deserve execution.',
                whyIntro2: 'We build them faster, smarter and better.',
                why1Title: 'Innovation', why1Desc: 'AI-powered creativity.',
                why2Title: 'Speed',       why2Desc: 'Weeks become days.',
                why3Title: 'Creativity',  why3Desc: 'Built to stand out.',
                why4Title: 'Quality',     why4Desc: 'Every pixel matters.',
                // Contact
                contactKicker: '// Contact',
                contactTitle: "Let's Build Something <em>Extraordinary</em>",
                contactDesc: 'Whether you need AI production, branding, design, or a modern website, let\'s create something that makes an impact.',
                contactPhone: 'Phone', contactEmail: 'Email', contactFollow: 'Follow',
                formName: 'Name', formNamePh: 'Your name',
                formEmail: 'Email', formEmailPh: 'your@email.com',
                formProject: 'Project Type', formProjectPh: 'AI Photo · AI Video · Design · Web Development',
                formMessage: 'Message', formMessagePh: 'Tell me about your project…',
                formSubmit: 'Send Message →',
                formSending: 'Sending…',
                formSuccessTitle: 'Message Sent!',
                formSuccessBody: "I'll get back to you within 24 hours.",
                // Footer
                footerBrandDesc: 'AI production, web development, and design — one seamless premium experience.',
                footerNavTitle: 'Navigate', footerHome: 'Home',
                footerContactTitle: 'Contact',
                footerCopy1: '© 2026 TG Studio. All rights reserved.',
                footerCopy2: 'Crafted with creativity & AI — Serbia, worldwide.',
            },
            sr: {
                // Nav
                navAbout: 'O nama', navPortfolio: 'Portfolio', navFaq: 'FAQ',
                navWhy: 'Zašto mi', navCta: 'Kontaktiraj nas →', navCta2: 'Kontakt',
                // Hero
                heroBadge: 'AI • DIZAJN • WEB', heroLine1: 'Dobrodošli u',
                heroAccent: 'Gde Ideje Postaju Stvarnost.',
                heroCta1: 'Pogledaj radove', heroCta2: 'Razgovarajmo',
                heroFooterAvail: 'Dostupni za projekte',
                // About
                aboutKicker: '// O nama',
                aboutTitle: 'Stvaramo <em>Digitalna Iskustva</em>',
                aboutIntro: 'Ja sam Todor — kreativni direktor i AI specijalista iz Srbije, pomažem brendovima širom sveta da komuniciraju precizno, elegantno i efektno.',
                aboutDesc: 'Od ideje do lansiranja — AI produkcija, grafički dizajn i web razvoj kao jedno vrhunsko iskustvo.',
                aboutExpertiseLabel: 'Ekspertiza',
                aboutPill1: 'AI Produkcija', aboutPill2: 'Web Razvoj',
                aboutPill3: 'Grafički Dizajn', aboutPill4: 'Brand Strategija',
                aboutCta: 'Pokreni projekat →', portraitRole: 'Kreativni Direktor & AI Specijalista',
                // Portfolio
                portfolioKicker: '// Portfolio',
                portfolioTitle: 'Radovi koji <em>Govore</em>',
                card1Title: 'AI Foto Produkcija',
                card1Desc: 'Luksuzna AI fotografija, reklamni vizuali, editorijalne kampanje, render proizvoda i sadržaj za društvene mreže.',
                card1Tag1: 'Editorijal', card1Tag2: 'Reklame', card1Tag3: 'Render Proizvoda', card1Tag4: 'Društvene mreže',
                card2Title: 'AI Video Produkcija',
                card2Desc: 'Kinematski AI videi, reklame, prikazi proizvoda, promotivni videi, reels za društvene mreže i narativni sadržaj.',
                card2Tag1: 'Reklame', card2Tag2: 'Prikazi', card2Tag3: 'Reels', card2Tag4: 'Naracija',
                card3Title: 'Grafički Dizajn',
                card3Desc: 'Vizuelni identitet, posteri, dizajn za društvene mreže, sličice, pakovanje, vizuelni sistemi i premium marketinški materijali.',
                card3Tag1: 'Vizuelni Identitet', card3Tag2: 'Posteri', card3Tag3: 'Pakovanje', card3Tag4: 'Vizuelni Sistemi',
                card4Title: 'Web Razvoj',
                card4Desc: 'Moderne veb stranice, landing stranice, poslovne stranice, portfoliji, UI/UX dizajn i visoko-konverzioni digitalni sadržaj.',
                card4Tag1: 'Landing Stranice', card4Tag2: 'UI/UX', card4Tag3: 'Portfoliji', card4Tag4: 'E-Commerce',
                // FAQ
                faqKicker: '// FAQ',
                faqTitle: 'Često Postavljana <em>Pitanja</em>',
                faq1Q: 'Koliko dugo traje projekat?',
                faq1A: 'Svaki projekat je drugačiji. Vreme isporuke zavisi od složenosti, obima i specifičnih zahteva.',
                faq2Q: 'Koliko košta projekat?',
                faq2A: 'Cena zavisi od veličine projekta, složenosti i traženih usluga.',
                faq3Q: 'Da li radite međunarodne projekte?',
                faq3A: 'Da. Sarađujemo sa klijentima širom sveta i pružamo potpunu online saradnju.',
                faq4Q: 'Možete li kreirati AI sadržaj prilagođen mom brendu?',
                faq4A: 'Apsolutno. Svaki projekat se prilagođava specifično vašem brendu i ciljevima.',
                faq5Q: 'Mogu li kombinovati više usluga?',
                faq5A: 'Da. Mnogi klijenti kombinuju AI produkciju, branding, dizajn i web razvoj u jedno kompletno rešenje.',
                // Why
                whyKicker: '// Zašto mi',
                whyTitle: 'Zašto odabrati <em>TG Studio?</em>',
                whyIntro1: 'Ideje zaslužuju realizaciju.',
                whyIntro2: 'Gradimo ih brže, pametnije i bolje.',
                why1Title: 'Inovacija', why1Desc: 'Kreativnost pokrenuta AI-jem.',
                why2Title: 'Brzina',    why2Desc: 'Nedelje postaju dani.',
                why3Title: 'Kreativnost', why3Desc: 'Dizajnirano da se istakne.',
                why4Title: 'Kvalitet', why4Desc: 'Svaki piksel je važan.',
                // Contact
                contactKicker: '// Kontakt',
                contactTitle: 'Hajde da izgradimo nešto <em>Izvanredno</em>',
                contactDesc: 'Bilo da vam treba AI produkcija, branding, dizajn ili moderna veb stranica — stvorimo nešto što ostavlja utisak.',
                contactPhone: 'Telefon', contactEmail: 'Mejl', contactFollow: 'Pratite nas',
                formName: 'Ime', formNamePh: 'Vaše ime',
                formEmail: 'Mejl', formEmailPh: 'vas@mejl.com',
                formProject: 'Tip projekta', formProjectPh: 'AI Foto · AI Video · Dizajn · Web Razvoj',
                formMessage: 'Poruka', formMessagePh: 'Ispričajte mi o svom projektu…',
                formSubmit: 'Pošalji poruku →',
                formSending: 'Slanje…',
                formSuccessTitle: 'Poruka poslata!',
                formSuccessBody: 'Odgovorim u roku od 24 sata.',
                // Footer
                footerBrandDesc: 'AI produkcija, web razvoj i dizajn — jedno vrhunsko iskustvo.',
                footerNavTitle: 'Navigacija', footerHome: 'Početna',
                footerContactTitle: 'Kontakt',
                footerCopy1: '© 2026 TG Studio. Sva prava zadržana.',
                footerCopy2: 'Kreirano s kreativnošću i AI — Srbija, svuda.',
            }
        };

        let currentLang = 'en';

        function applyLang(lang) {
            currentLang = lang;
            const t = translations[lang];
            document.querySelectorAll('[data-i18n]').forEach(el => {
                const key = el.dataset.i18n;
                if (t[key] !== undefined) el.textContent = t[key];
            });
            document.querySelectorAll('[data-i18n-html]').forEach(el => {
                const key = el.dataset.i18nHtml;
                if (t[key] !== undefined) el.innerHTML = t[key];
            });
            document.querySelectorAll('[data-i18n-ph]').forEach(el => {
                const key = el.dataset.i18nPh;
                if (t[key] !== undefined) el.placeholder = t[key];
            });
            document.querySelectorAll('.lang-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.lang === lang);
            });
        }

        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.addEventListener('click', () => applyLang(btn.dataset.lang));
        });

        applyLang('en');

        // FAQ accordion
        document.querySelectorAll('[data-faq]').forEach(item => {
            item.querySelector('.faq-question').addEventListener('click', () => {
                const wasOpen = item.classList.contains('open');
                document.querySelectorAll('[data-faq]').forEach(i => i.classList.remove('open'));
                if (!wasOpen) item.classList.add('open');
            });
        });

        // Scroll reveal
        const revealObs = new IntersectionObserver((entries) => {
            entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); revealObs.unobserve(e.target); } });
        }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
        document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

        // Contact form
        function handleFormSubmit(e) {
            e.preventDefault();
            const btn = document.getElementById('form-submit-btn');
            const t = translations[currentLang];
            btn.disabled = true;
            btn.textContent = t.formSending;
            setTimeout(() => {
                document.getElementById('contact-form-wrap').innerHTML = `
                    <div class="form-success glass" style="border-radius:1.25rem">
                        <div class="form-success-symbol">✦</div>
                        <p style="font-family:var(--font-serif);font-style:italic;font-size:1.4rem;color:var(--c-highlight);margin-bottom:0.5rem">${t.formSuccessTitle}</p>
                        <p>${t.formSuccessBody}</p>
                    </div>`;
            }, 1200);
        }

(() => {
        /* ─── DATA ─── */
        // Editorial collage: each entry has art-directed position (cx/cy as % of overlay) and size (vw, clamped)
        const CATEGORIES = [
            { name: 'Odeća',          folder: 'odeca',        cx:  8, cy: 50, w: 'clamp(148px,13.5vw,205px)' },
            { name: 'Nakit',          folder: 'nakit',        cx: 22, cy: 22, w: 'clamp(128px,10.8vw,165px)' },
            { name: 'Kozmetika',      folder: 'kozmetika',    cx: 38, cy: 16, w: 'clamp(148px,13vw,198px)'   },
            { name: 'Piće',           folder: 'pice',         cx: 53, cy: 60, w: 'clamp(135px,11.5vw,175px)' },
            { name: 'Hrana',          folder: 'hrana',        cx: 50, cy: 36, w: 'clamp(145px,12.5vw,190px)' },
            { name: 'Aksesoari',      folder: 'aksesoari',    cx: 66, cy: 20, w: 'clamp(122px,10.2vw,155px)' },
            { name: 'Školski pribor', folder: 'skolski-pribor', cx: 24, cy: 73, w: 'clamp(128px,10.8vw,164px)' },
            { name: 'Ljubimci',       folder: 'ljubimci',     cx: 70, cy: 65, w: 'clamp(140px,12vw,182px)'   },
            { name: 'Enterijer',      folder: 'enterijer',    cx: 85, cy: 45, w: 'clamp(132px,11.2vw,170px)' },
        ];
        const IMG_EXT = /\.(jpe?g|png|webp|gif|avif)(\?.*)?$/i;
        const BASE    = `FINAL/${encodeURIComponent('SEKCIJE SLIKE')}/`;

        /* ─── ELEMENTS ─── */
        const trigger     = document.getElementById('card-photo-trigger');
        const catOverlay  = document.getElementById('cat-overlay');
        const catCanvas   = document.getElementById('cat-canvas');
        const catCloseBtn = document.getElementById('cat-close-btn');
        const galOverlay  = document.getElementById('gal-overlay');
        const galCatLabel = document.getElementById('gal-cat-label');
        const galCounter  = document.getElementById('gal-counter');
        const galImg      = document.getElementById('gal-img');
        const galPrev     = document.getElementById('gal-prev');
        const galNext     = document.getElementById('gal-next');
        const galThumbs   = document.getElementById('gal-thumbs');
        const galBackBtn  = document.getElementById('gal-back-btn');
        const galStage    = document.getElementById('gal-stage');

        let currentImages = [];
        let currentIdx    = 0;
        let touchStartX   = 0;

        /* ─── COVER IMAGE ─── */
        // Try .webp → .jpg → .png in order via onerror cascade
        function setCoverSrc(img, folder) {
            const b = `${BASE}${folder}/cover`;
            img.src = `${b}.webp`;
            img.onerror = () => {
                img.src = `${b}.jpg`;
                img.onerror = () => {
                    img.src = `${b}.png`;
                    img.onerror = () => {
                        img.parentNode.innerHTML = placeholderSVG();
                        img.onerror = null;
                    };
                };
            };
        }

        function placeholderSVG() {
            return `<div class="cat-card-placeholder">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="1">
                    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                </svg>
            </div>`;
        }

        /* ─── GALLERY IMAGE LOADER ─── */
        // Fetch directory listing, strip cover.* and non-image files
        async function loadGalleryImages(folder) {
            try {
                const res = await fetch(`${BASE}${folder}/`);
                if (!res.ok) return [];
                const html = await res.text();
                const doc  = new DOMParser().parseFromString(html, 'text/html');
                return [...doc.querySelectorAll('a[href]')]
                    .map(a => a.getAttribute('href'))
                    .filter(h => IMG_EXT.test(h) && !h.startsWith('?') && !/^cover\./i.test(h))
                    .sort()
                    .map(h => `${BASE}${folder}/${h}`);
            } catch { return []; }
        }

        /* ─── EDITORIAL COLLAGE BUILDER ─── */
        function buildCollage() {
            catCanvas.innerHTML = '';

            CATEGORIES.forEach((cat, i) => {
                const card = document.createElement('div');
                card.className = 'cat-card';
                card.style.left  = `${cat.cx}%`;
                card.style.top   = `${cat.cy}%`;
                card.style.width = cat.w;
                card.style.transitionDelay = `${i * 65}ms`;

                const imgWrap = document.createElement('div');
                imgWrap.className = 'cat-card-img';
                const img = document.createElement('img');
                img.alt = cat.name;
                img.loading = 'lazy';
                setCoverSrc(img, cat.folder);
                imgWrap.appendChild(img);

                const title = document.createElement('div');
                title.className = 'cat-card-title';
                title.textContent = cat.name;

                card.appendChild(imgWrap);
                card.appendChild(title);
                card.addEventListener('click', () => openGallery(cat));
                catCanvas.appendChild(card);
            });
        }

        function animateCardsIn() {
            requestAnimationFrame(() => {
                document.querySelectorAll('.cat-card').forEach(c => c.classList.add('entered'));
            });
        }
        function animateCardsOut() {
            document.querySelectorAll('.cat-card').forEach(c => c.classList.remove('entered'));
        }

        /* ─── CATEGORY OVERLAY OPEN/CLOSE ─── */
        function openCatSelector() {
            buildCollage();
            catOverlay.classList.add('visible');
            document.body.style.overflow = 'hidden';
            setTimeout(animateCardsIn, 60);
        }

        function closeCatSelector() {
            animateCardsOut();
            catOverlay.classList.remove('visible');
            if (!galOverlay.classList.contains('visible')) {
                document.body.style.overflow = '';
            }
        }

        /* ─── GALLERY OPEN/CLOSE ─── */
        async function openGallery(cat) {
            galCatLabel.textContent = cat.name;
            galThumbs.innerHTML = '';
            galImg.classList.remove('loaded');
            galImg.src = '';

            closeCatSelector();
            await delay(300);
            galOverlay.classList.add('visible');

            const imgs = await loadGalleryImages(cat.folder);
            currentImages = imgs;
            currentIdx    = 0;

            // Restore stage if it was replaced by empty message
            if (!galStage.querySelector('.gallery-img-wrap')) {
                galStage.innerHTML = `
                    <div class="gallery-img-wrap" id="gal-img-wrap">
                        <img id="gal-img" src="" alt="">
                    </div>
                    <button class="gallery-nav-btn prev" id="gal-prev">&#8249;</button>
                    <button class="gallery-nav-btn next" id="gal-next">&#8250;</button>`;
                galStage.querySelector('#gal-prev').addEventListener('click', () => step(-1));
                galStage.querySelector('#gal-next').addEventListener('click', () => step(1));
            }

            const img  = galStage.querySelector('#gal-img')  || galImg;
            const prev = galStage.querySelector('#gal-prev') || galPrev;
            const next = galStage.querySelector('#gal-next') || galNext;

            if (!imgs.length) {
                galStage.innerHTML = `<div class="gallery-empty">No images in this category yet.<br><span style="font-size:0.75rem;letter-spacing:0.1em;opacity:0.5">Add images to FINAL/SEKCIJE SLIKE/${cat.folder}/</span></div>`;
                prev.style.display = 'none';
                next.style.display = 'none';
                galThumbs.innerHTML = '';
                galCounter.textContent = '';
                return;
            }

            buildThumbs(imgs);
            showImage(0);
        }

        function closeGallery() {
            galOverlay.classList.remove('visible');
            document.body.style.overflow = '';
            currentImages = [];
        }

        function backToCategories() {
            galOverlay.classList.remove('visible');
            setTimeout(() => {
                buildCollage();
                catOverlay.classList.add('visible');
                setTimeout(animateCardsIn, 60);
            }, 320);
        }

        /* ─── IMAGE DISPLAY ─── */
        function showImage(idx) {
            currentIdx = idx;
            const src  = currentImages[idx];
            const img  = document.getElementById('gal-img')  || galImg;
            const prev = document.getElementById('gal-prev') || galPrev;
            const next = document.getElementById('gal-next') || galNext;

            img.classList.remove('loaded');
            const tmp = new Image();
            tmp.onload = () => {
                img.src = src;
                img.alt = `Image ${idx + 1}`;
                requestAnimationFrame(() => img.classList.add('loaded'));
            };
            tmp.src = src;

            galCounter.textContent = `${String(idx+1).padStart(2,'0')} / ${String(currentImages.length).padStart(2,'0')}`;
            prev.disabled = idx === 0;
            next.disabled = idx === currentImages.length - 1;

            document.querySelectorAll('.gallery-thumb').forEach((t, i) => {
                t.classList.toggle('active', i === idx);
                if (i === idx) t.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
            });
        }

        function buildThumbs(imgs) {
            galThumbs.innerHTML = '';
            imgs.forEach((src, i) => {
                const wrap = document.createElement('div');
                wrap.className = 'gallery-thumb' + (i === 0 ? ' active' : '');
                const img = document.createElement('img');
                img.src = src; img.alt = ''; img.loading = 'lazy';
                wrap.appendChild(img);
                wrap.addEventListener('click', () => showImage(i));
                galThumbs.appendChild(wrap);
            });
        }

        function step(dir) {
            const next = currentIdx + dir;
            if (next >= 0 && next < currentImages.length) showImage(next);
        }

        /* ─── EVENTS ─── */
        trigger.addEventListener('click', openCatSelector);
        catCloseBtn.addEventListener('click', closeCatSelector);
        galBackBtn.addEventListener('click', backToCategories);
        galPrev.addEventListener('click', () => step(-1));
        galNext.addEventListener('click', () => step(1));

        // Append close button to gallery overlay
        const galCloseBtn = document.createElement('button');
        galCloseBtn.className = 'overlay-close-btn';
        galCloseBtn.textContent = 'ESC ✕';
        galCloseBtn.addEventListener('click', closeGallery);
        galOverlay.appendChild(galCloseBtn);

        // Keyboard
        document.addEventListener('keydown', e => {
            if (galOverlay.classList.contains('visible')) {
                if (e.key === 'ArrowLeft')  step(-1);
                if (e.key === 'ArrowRight') step(1);
                if (e.key === 'Escape')     closeGallery();
            } else if (catOverlay.classList.contains('visible')) {
                if (e.key === 'Escape') closeCatSelector();
            }
        });

        // Swipe
        galStage.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
        galStage.addEventListener('touchend',   e => {
            const dx = e.changedTouches[0].clientX - touchStartX;
            if (Math.abs(dx) > 45) step(dx < 0 ? 1 : -1);
        });

        // Rebuild on resize
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                if (catOverlay.classList.contains('visible')) buildCollage();
            }, 180);
        });

        function delay(ms) { return new Promise(r => setTimeout(r, ms)); }
    })();