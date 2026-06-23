// ============================================
// VISUALIZACIÓN 3D DE LA RACHA
// ============================================

class Streak3DViewer {
    constructor() {
        this.modal = null;
        this.container = null;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.animationId = null;
        this.blocks = [];
        this.floatingElements = [];
        this.isOpen = false;
    }

    init() {
        // Crear elementos del DOM
        this.modal = document.getElementById('streak3DModal');
        this.container = document.getElementById('streak3DContainer');
        
        if (!this.modal || !this.container) {
            console.error('Elementos del modal 3D no encontrados');
            return;
        }

        // Crear botón de cierre
        const closeBtn = document.createElement('button');
        closeBtn.className = 'streak-3d-close';
        closeBtn.innerHTML = '×';
        closeBtn.addEventListener('click', () => this.close());
        this.container.appendChild(closeBtn);

        // Crear info overlay
        const info = document.createElement('div');
        info.className = 'streak-3d-info';
        info.innerHTML = 'Arrastra para rotar • Scroll para zoom';
        this.container.appendChild(info);

        // Hacer clickeable el indicador de racha
        const streakDisplay = document.getElementById('streakDisplay');
        if (streakDisplay) {
            streakDisplay.addEventListener('click', () => {
                const streak = this.getCurrentStreak();
                if (streak >= 1) {
                    this.open(streak);
                }
            });

            // Actualizar cursor
            this.updateStreakCursor();
        }

        // Cerrar con ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });

        console.log('✅ Visualización 3D de racha inicializada');
    }

    getCurrentStreak() {
        // Obtener la racha actual del sistema
        if (typeof calculateStreak === 'function') {
            return calculateStreak();
        }
        return 0;
    }

    updateStreakCursor() {
        const streakDisplay = document.getElementById('streakDisplay');
        if (!streakDisplay) return;

        const streak = this.getCurrentStreak();
        if (streak >= 1) {
            streakDisplay.classList.add('active');
            streakDisplay.classList.remove('disabled');
            streakDisplay.title = `${streak} días de racha - Click para ver tu torre`;
        } else {
            streakDisplay.classList.remove('active');
            streakDisplay.classList.add('disabled');
            streakDisplay.title = 'Racha de días consecutivos';
        }
    }

    open(streakDays) {
        if (this.isOpen) return;
        
        this.isOpen = true;
        this.modal.classList.add('active');
        
        // Inicializar Three.js
        this.initThreeJS();
        
        // Crear la escena 3D
        this.createScene(streakDays);
        
        // Iniciar animación
        this.animate();
    }

    close() {
        if (!this.isOpen) return;
        
        this.isOpen = false;
        this.modal.classList.remove('active');
        
        // Detener animación
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        // Limpiar escena
        this.cleanup();
    }

    initThreeJS() {
        // Crear escena
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x000000, 20, 100);

        // Crear cámara
        const aspect = window.innerWidth / window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
        this.camera.position.set(10, 15, 20);
        this.camera.lookAt(0, 0, 0);

        // Crear renderer
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true, 
            alpha: true 
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);

        // Controles de órbita
        if (typeof THREE.OrbitControls !== 'undefined') {
            this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.05;
            this.controls.minDistance = 10;
            this.controls.maxDistance = 50;
            this.controls.maxPolarAngle = Math.PI / 2;
            this.controls.enableZoom = true; // Asegurar que el zoom esté habilitado
            this.controls.zoomSpeed = 1.0;
        } else {
            // Fallback: controles manuales básicos
            let isDragging = false;
            let previousMousePosition = { x: 0, y: 0 };
            
            this.renderer.domElement.addEventListener('mousedown', (e) => {
                if (e.button === 0) { // Solo botón izquierdo
                    isDragging = true;
                }
            });
            
            this.renderer.domElement.addEventListener('mousemove', (e) => {
                if (isDragging) {
                    const deltaMove = {
                        x: e.clientX - previousMousePosition.x,
                        y: e.clientY - previousMousePosition.y
                    };
                    
                    this.camera.position.x += deltaMove.x * 0.05;
                    this.camera.position.y -= deltaMove.y * 0.05;
                    this.camera.lookAt(0, 0, 0);
                }
                
                previousMousePosition = {
                    x: e.clientX,
                    y: e.clientY
                };
            });
            
            this.renderer.domElement.addEventListener('mouseup', () => {
                isDragging = false;
            });
            
            // Zoom manual con scroll
            this.renderer.domElement.addEventListener('wheel', (e) => {
                e.preventDefault();
                const delta = e.deltaY * 0.01;
                const distance = this.camera.position.length();
                const newDistance = Math.max(10, Math.min(50, distance + delta));
                this.camera.position.multiplyScalar(newDistance / distance);
            });
        }

        // Luces
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 20, 10);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);

        const pointLight1 = new THREE.PointLight(0xff8c42, 1, 50);
        pointLight1.position.set(-10, 10, 10);
        this.scene.add(pointLight1);

        const pointLight2 = new THREE.PointLight(0x06ffa5, 1, 50);
        pointLight2.position.set(10, 10, -10);
        this.scene.add(pointLight2);

        // Manejar resize
        window.addEventListener('resize', () => this.onWindowResize());
    }

    createScene(streakDays) {
        this.blocks = [];
        this.floatingElements = [];

        // NO MÁS TORRE - ELIMINADA

        // Crear LLAMA DE FUEGO 3D con el número de racha
        this.createFireWithNumber(streakDays);

        // Crear BADGES DESBLOQUEADOS como esferas de colores
        this.createUnlockedBadges(streakDays);

        // Crear textos 3D grandes de la racha
        this.createBigStreakText(streakDays);

        // Crear sopa de letras 3D
        this.createLetterSoup();

        // Crear partículas de fondo
        this.createParticles();
    }

    createFireWithNumber(streakDays) {
        // Crear LLAMA DE FUEGO 3D con geometrías puras
        const fireGroup = new THREE.Group();
        
        // Base de la llama (naranja)
        const baseGeometry = new THREE.ConeGeometry(1.5, 3, 8);
        const baseMaterial = new THREE.MeshPhongMaterial({
            color: 0xff6600,
            emissive: 0xff4400,
            emissiveIntensity: 0.8,
            shininess: 30
        });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = 1.5;
        
        // Parte media de la llama (naranja-amarillo)
        const midGeometry = new THREE.ConeGeometry(1.2, 2.5, 8);
        const midMaterial = new THREE.MeshPhongMaterial({
            color: 0xff8800,
            emissive: 0xff6600,
            emissiveIntensity: 0.9,
            shininess: 50
        });
        const mid = new THREE.Mesh(midGeometry, midMaterial);
        mid.position.y = 2.8;
        
        // Punta de la llama (amarillo brillante)
        const tipGeometry = new THREE.ConeGeometry(0.8, 2, 8);
        const tipMaterial = new THREE.MeshPhongMaterial({
            color: 0xffdd00,
            emissive: 0xffbb00,
            emissiveIntensity: 1.0,
            shininess: 100
        });
        const tip = new THREE.Mesh(tipGeometry, tipMaterial);
        tip.position.y = 4;
        
        // Luz puntual de la llama
        const fireLight = new THREE.PointLight(0xff6600, 5, 15);
        fireLight.position.y = 3;
        
        fireGroup.add(base);
        fireGroup.add(mid);
        fireGroup.add(tip);
        fireGroup.add(fireLight);
        
        // Posicionar la llama a la izquierda del centro
        fireGroup.position.set(-5, 5, 0);
        
        fireGroup.userData = {
            base: base,
            mid: mid,
            tip: tip,
            light: fireLight,
            baseScale: 1,
            type: 'fire'
        };
        
        this.floatingElements.push(fireGroup);
        this.scene.add(fireGroup);
        
        // Crear NÚMERO DE RACHA grande al lado de la llama
        this.createBigNumber(streakDays);
    }

    createBigNumber(number) {
        // Número gigante al lado de la llama
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        
        ctx.clearRect(0, 0, 512, 512);
        
        // Número con borde
        ctx.font = 'bold 280px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#ff6600';
        ctx.lineWidth = 15;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const text = number.toString();
        ctx.strokeText(text, 256, 256);
        ctx.fillText(text, 256, 256);
        
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            opacity: 1.0
        });
        
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(6, 6, 1);
        sprite.position.set(2, 5, 0);
        
        sprite.userData = {
            type: 'number',
            baseY: 5
        };
        
        this.floatingElements.push(sprite);
        this.scene.add(sprite);
    }

    createTower(streakDays) {
        // ELIMINADA - Ya no se usa
    }

    animateBlockEntry(block, delay) {
        setTimeout(() => {
            const startTime = Date.now();
            const duration = 600;

            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Easing: elastic out
                const scale = this.easeElasticOut(progress);
                block.scale.set(scale, scale, scale);

                if (progress < 1) {
                    requestAnimationFrame(animate);
                }
            };

            animate();
        }, delay);
    }

    createUnlockedBadges(streakDays) {
        // Badges desbloqueados como ESFERAS BRILLANTES
        if (!window.streakSystem) return;

        const unlockedBadges = window.streakSystem.getAllUnlockedBadges(streakDays);
        if (!unlockedBadges || unlockedBadges.length === 0) return;

        const radius = 12; // Radio más grande
        const verticalSpread = 8; // Distribución vertical

        unlockedBadges.forEach((badgeData, index) => {
            // Distribución circular alrededor de la escena
            const angle = (index / unlockedBadges.length) * Math.PI * 2;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            const y = 5 + (Math.sin(angle * 3) * verticalSpread); // Variación vertical

            // ESFERA BRILLANTE con el color del badge
            const sphereGeometry = new THREE.SphereGeometry(1.0, 32, 32);
            const badgeColor = new THREE.Color(badgeData.color);
            
            const sphereMaterial = new THREE.MeshPhongMaterial({
                color: badgeColor,
                emissive: badgeColor,
                emissiveIntensity: 0.6,
                shininess: 120,
                specular: 0xffffff
            });
            
            const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
            
            // Anillos orbitales alrededor del badge
            const ring1 = new THREE.Mesh(
                new THREE.TorusGeometry(1.4, 0.08, 16, 50),
                new THREE.MeshBasicMaterial({ 
                    color: badgeColor, 
                    transparent: true, 
                    opacity: 0.7 
                })
            );
            ring1.rotation.x = Math.PI / 2 + Math.random() * 0.5;
            ring1.rotation.y = Math.random() * Math.PI;
            
            const ring2 = new THREE.Mesh(
                new THREE.TorusGeometry(1.7, 0.05, 16, 50),
                new THREE.MeshBasicMaterial({ 
                    color: badgeColor, 
                    transparent: true, 
                    opacity: 0.4 
                })
            );
            ring2.rotation.x = Math.PI / 2 - Math.random() * 0.5;
            ring2.rotation.z = Math.random() * Math.PI;
            
            // Luz puntual del badge
            const badgeLight = new THREE.PointLight(badgeColor, 2, 8);
            
            const badgeGroup = new THREE.Group();
            badgeGroup.add(sphere);
            badgeGroup.add(ring1);
            badgeGroup.add(ring2);
            badgeGroup.add(badgeLight);
            
            badgeGroup.position.set(x, y, z);

            badgeGroup.userData = {
                originalPosition: { x, y, z },
                floatSpeed: 0.3 + Math.random() * 0.2,
                ring1: ring1,
                ring2: ring2,
                badge: badgeData,
                type: 'badge'
            };

            this.floatingElements.push(badgeGroup);
            this.scene.add(badgeGroup);

            // Animación de entrada escalonada
            badgeGroup.scale.set(0, 0, 0);
            this.animateBadgeEntry(badgeGroup, index * 150 + 800);
        });
    }

    animateBadgeEntry(group, delay) {
        setTimeout(() => {
            const startTime = Date.now();
            const duration = 1000;

            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                const scale = this.easeElasticOut(progress);
                group.scale.set(scale, scale, scale);

                if (progress < 1) {
                    requestAnimationFrame(animate);
                }
            };

            animate();
        }, delay);
    }

    createFloatingBadges(streakDays) {
        // OBSOLETO - Usar createUnlockedBadges
    }

    createColorBadges(streakDays) {
        // OBSOLETO - Usar createUnlockedBadges
    }

    createBigStreakText(streakDays) {
        // TEXTOS GRANDES 3D - Usando sprites simples sin emojis
        const messages = [
            { text: `${streakDays} DIAS`, y: 15 },
            { text: 'TU RACHA', y: 12 },
            { text: 'IMPARABLE', y: 18 }
        ];

        messages.forEach((msg, index) => {
            // Crear texto como sprites SIMPLES sin emojis problemáticos
            const canvas = document.createElement('canvas');
            canvas.width = 512;
            canvas.height = 128;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            
            // IMPORTANTE: Limpiar completamente
            ctx.clearRect(0, 0, 512, 128);
            
            // Solo texto, sin emojis
            ctx.font = 'bold 60px Arial';
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#ff8c42';
            ctx.lineWidth = 3;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Dibujar con borde
            ctx.strokeText(msg.text, 256, 64);
            ctx.fillText(msg.text, 256, 64);
            
            const texture = new THREE.CanvasTexture(canvas);
            const material = new THREE.SpriteMaterial({
                map: texture,
                transparent: true,
                opacity: 0.9
            });
            
            const sprite = new THREE.Sprite(material);
            sprite.scale.set(8, 2, 1);
            
            const angle = (index / messages.length) * Math.PI * 2;
            sprite.position.set(
                Math.cos(angle) * 10,
                msg.y,
                Math.sin(angle) * 10
            );
            
            sprite.userData = {
                originalPosition: { 
                    x: sprite.position.x, 
                    y: sprite.position.y, 
                    z: sprite.position.z 
                },
                floatSpeed: 0.2,
                rotateSpeed: 0.001
            };
            
            this.floatingElements.push(sprite);
            this.scene.add(sprite);
            
            // Fade in
            sprite.material.opacity = 0;
            this.animateTextEntry(sprite, index * 200 + 800);
        });
    }

    animateBadgeGroupEntry(group, delay) {
        setTimeout(() => {
            const startTime = Date.now();
            const duration = 800;

            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                const scale = this.easeElasticOut(progress);
                group.scale.set(scale, scale, scale);

                if (progress < 1) {
                    requestAnimationFrame(animate);
                }
            };

            animate();
        }, delay);
    }

    adjustColorBrightness(color, amount) {
        // Convertir color hex a RGB y ajustar brillo
        const hex = color.replace('#', '');
        const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount));
        const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount));
        const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount));
        return `rgb(${r}, ${g}, ${b})`;
    }

    createFloatingText(streakDays) {
        // ELIMINADO - Este causaba el recuadro rojo
        // En su lugar, las letras están en createLetterSoup()
    }

    createLetterSoup() {
        // Crear sopa de letras 3D flotantes
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const letterCount = 100;
        
        for (let i = 0; i < letterCount; i++) {
            const randomLetter = letters[Math.floor(Math.random() * letters.length)];
            const size = 0.3 + Math.random() * 0.8; // Tamaños variados
            
            // Crear geometría de texto 3D
            const canvas = document.createElement('canvas');
            const canvasSize = 128;
            canvas.width = canvasSize;
            canvas.height = canvasSize;
            const ctx = canvas.getContext('2d');
            
            // Fondo transparente
            ctx.clearRect(0, 0, canvasSize, canvasSize);
            
            // Dibujar letra
            ctx.font = `bold ${canvasSize * 0.7}px Arial`;
            ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + Math.random() * 0.4})`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(randomLetter, canvasSize / 2, canvasSize / 2);
            
            const texture = new THREE.CanvasTexture(canvas);
            const material = new THREE.SpriteMaterial({
                map: texture,
                transparent: true,
                opacity: 0.6 + Math.random() * 0.4,
                depthTest: false
            });
            
            const sprite = new THREE.Sprite(material);
            sprite.scale.set(size, size, 1);
            
            // Posición aleatoria en un volumen grande
            sprite.position.set(
                (Math.random() - 0.5) * 40,
                Math.random() * 30 - 5,
                (Math.random() - 0.5) * 40
            );
            
            sprite.userData = {
                rotateSpeed: 0.001 + Math.random() * 0.003,
                floatSpeed: 0.1 + Math.random() * 0.2,
                axis: Math.random() < 0.5 ? 'x' : 'z'
            };
            
            this.floatingElements.push(sprite);
            this.scene.add(sprite);
        }
    }

    createParticles() {
        const particlesGeometry = new THREE.BufferGeometry();
        const particlesCount = 300; // Más partículas
        const posArray = new Float32Array(particlesCount * 3);

        for (let i = 0; i < particlesCount * 3; i++) {
            posArray[i] = (Math.random() - 0.5) * 60;
        }

        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

        const particlesMaterial = new THREE.PointsMaterial({
            size: 0.15,
            color: 0xffffff,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });

        const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
        this.scene.add(particlesMesh);

        // Guardar para animación
        this.particles = particlesMesh;
    }

    animateSpriteEntry(sprite, delay) {
        setTimeout(() => {
            const startTime = Date.now();
            const duration = 800;
            const targetScale = 3.5;

            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                const scale = this.easeElasticOut(progress) * targetScale;
                sprite.scale.set(scale, scale, 1);

                if (progress < 1) {
                    requestAnimationFrame(animate);
                }
            };

            animate();
        }, delay);
    }

    animateBadgeGroupEntry(group, delay) {
        setTimeout(() => {
            const startTime = Date.now();
            const duration = 800;

            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                const scale = this.easeElasticOut(progress);
                group.scale.set(scale, scale, scale);

                if (progress < 1) {
                    requestAnimationFrame(animate);
                }
            };

            animate();
        }, delay);
    }

    animateTextEntry(sprite, delay) {
        setTimeout(() => {
            const startTime = Date.now();
            const duration = 600;

            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                sprite.material.opacity = this.easeOutCubic(progress) * 0.7;

                if (progress < 1) {
                    requestAnimationFrame(animate);
                }
            };

            animate();
        }, delay);
    }

    animate() {
        if (!this.isOpen) return;

        this.animationId = requestAnimationFrame(() => this.animate());

        const time = Date.now() * 0.001;

        // Animar bloques (flotación suave) - YA NO SE USA
        // this.blocks ya no existe

        // Animar elementos flotantes
        this.floatingElements.forEach((element, index) => {
            const userData = element.userData;
            
            // LLAMA DE FUEGO - animación de parpadeo
            if (userData.type === 'fire') {
                // Parpadeo de la llama
                const flicker = Math.sin(time * 10) * 0.1 + Math.sin(time * 15) * 0.05;
                userData.base.scale.set(1 + flicker, 1 + flicker * 0.5, 1 + flicker);
                userData.mid.scale.set(1 + flicker * 1.2, 1 + flicker * 0.8, 1 + flicker * 1.2);
                userData.tip.scale.set(1 + flicker * 1.5, 1 + flicker, 1 + flicker * 1.5);
                
                // Intensidad de luz parpadeante
                userData.light.intensity = 5 + flicker * 2;
                
                // Rotación suave
                element.rotation.y += 0.01;
            }
            // BADGES - flotación y rotación de anillos
            else if (userData.type === 'badge') {
                const offset = Math.sin(time * userData.floatSpeed + index) * 0.4;
                element.position.y = userData.originalPosition.y + offset;
                
                // Rotar anillos en direcciones opuestas
                if (userData.ring1) userData.ring1.rotation.z += 0.02;
                if (userData.ring2) userData.ring2.rotation.z -= 0.015;
                
                // Rotación del grupo completo
                element.rotation.y += 0.008;
            }
            // NÚMERO - flotación suave
            else if (userData.type === 'number') {
                const offset = Math.sin(time * 0.5) * 0.3;
                element.position.y = userData.baseY + offset;
            }
            // Texto grande (sprites con originalPosition)
            else if (userData.originalPosition && userData.rotateSpeed !== undefined) {
                const offset = Math.sin(time * userData.floatSpeed + index * 0.5) * 0.5;
                element.position.y = userData.originalPosition.y + offset;
                element.rotation.y += userData.rotateSpeed;
            }
            // Letras de sopa
            else if (userData.axis) {
                if (userData.axis === 'x') {
                    element.position.x += Math.sin(time * userData.floatSpeed) * 0.01;
                } else {
                    element.position.z += Math.sin(time * userData.floatSpeed) * 0.01;
                }
                element.rotation.z += userData.rotateSpeed;
            }
        });

        // Animar partículas
        if (this.particles) {
            this.particles.rotation.y += 0.0005;
        }

        // Actualizar controles
        if (this.controls) {
            this.controls.update();
        }

        // Renderizar
        this.renderer.render(this.scene, this.camera);
    }

    cleanup() {
        // Limpiar geometrías y materiales
        this.floatingElements.forEach(element => {
            if (element.geometry) {
                element.geometry.dispose();
            }
            if (element.material) {
                if (element.material.map) element.material.map.dispose();
                element.material.dispose();
            }
            // Limpiar grupos
            if (element.children) {
                element.children.forEach(child => {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) child.material.dispose();
                });
            }
            this.scene.remove(element);
        });

        if (this.particles) {
            this.particles.geometry.dispose();
            this.particles.material.dispose();
            this.scene.remove(this.particles);
        }

        // Limpiar renderer
        if (this.renderer) {
            this.renderer.dispose();
            if (this.renderer.domElement && this.renderer.domElement.parentNode) {
                this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
            }
        }

        this.blocks = [];
        this.floatingElements = [];
        this.particles = null;
    }

    onWindowResize() {
        if (!this.camera || !this.renderer) return;

        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    // Funciones de easing
    easeElasticOut(t) {
        const c4 = (2 * Math.PI) / 3;
        return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
    }

    easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.streak3DViewer = new Streak3DViewer();
    window.streak3DViewer.init();
});

// Exportar para uso global
window.Streak3DViewer = Streak3DViewer;

console.log('✅ Módulo de visualización 3D de racha cargado');
