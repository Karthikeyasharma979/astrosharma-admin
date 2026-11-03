import React, { useEffect, useRef } from 'react';

const CosmicBackground = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;

        const setCanvasSize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        setCanvasSize();
        window.addEventListener('resize', setCanvasSize);

        const stars = Array.from({ length: 150 }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2,
            speedX: (Math.random() - 0.5) * 0.3,
            speedY: (Math.random() - 0.5) * 0.3,
            opacity: Math.random(),
            opacitySpeed: (Math.random() - 0.5) * 0.02,
            color: Math.random() > 0.8 ? '#fff8e7' : (Math.random() > 0.6 ? '#f59e0b' : '#ffffff')
        }));

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Subtle cosmic gradient base
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            gradient.addColorStop(0, 'rgba(15, 23, 42, 1)'); // slate-900
            gradient.addColorStop(1, 'rgba(20, 20, 35, 1)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            stars.forEach(star => {
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
                ctx.fillStyle = star.color;
                ctx.globalAlpha = Math.max(0, Math.min(1, star.opacity));
                ctx.fill();

                star.x += star.speedX;
                star.y += star.speedY;
                star.opacity += star.opacitySpeed;

                if (star.opacity <= 0 || star.opacity >= 1) {
                    star.opacitySpeed *= -1;
                }

                if (star.x < 0) star.x = canvas.width;
                if (star.x > canvas.width) star.x = 0;
                if (star.y < 0) star.y = canvas.height;
                if (star.y > canvas.height) star.y = 0;
            });

            ctx.globalAlpha = 1; // reset alpha

            // Add some warm nebula glows with #fff8e7
            const nebula1 = ctx.createRadialGradient(canvas.width * 0.2, canvas.height * 0.2, 0, canvas.width * 0.2, canvas.height * 0.2, canvas.width * 0.4);
            nebula1.addColorStop(0, 'rgba(255, 248, 231, 0.06)'); // warm ivory cream #fff8e7
            nebula1.addColorStop(1, 'rgba(255, 248, 231, 0)');
            ctx.fillStyle = nebula1;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            const nebula2 = ctx.createRadialGradient(canvas.width * 0.8, canvas.height * 0.8, 0, canvas.width * 0.8, canvas.height * 0.8, canvas.width * 0.5);
            nebula2.addColorStop(0, 'rgba(56, 189, 248, 0.05)'); // sky blue
            nebula2.addColorStop(1, 'rgba(56, 189, 248, 0)');
            ctx.fillStyle = nebula2;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            animationFrameId = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            window.removeEventListener('resize', setCanvasSize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas 
            ref={canvasRef} 
            className="fixed inset-0 pointer-events-none -z-50"
        />
    );
};

export default CosmicBackground;
