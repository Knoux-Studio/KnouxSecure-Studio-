// Web Audio API Sound Synthesizer for KnouxSecure
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
}

export function playSecuritySound(type: 'success' | 'unlock' | 'scan' | 'error') {
    try {
        const ctx = getAudioContext();
        const now = ctx.currentTime;
        
        if (type === 'success') {
            // High-pitched positive chime
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(523.25, now); // C5
            osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
            osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
            
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.08, now + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
            
            osc.start(now);
            osc.stop(now + 0.45);
        } else if (type === 'unlock') {
            // Warm rich rising sci-fi sweep
            const osc = ctx.createOscillator();
            const filter = ctx.createBiquadFilter();
            const gain = ctx.createGain();
            
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);
            
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(220, now); // A3
            osc.frequency.exponentialRampToValueAtTime(440, now + 0.25); // A4
            osc.frequency.exponentialRampToValueAtTime(880, now + 0.5); // A5
            
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(300, now);
            filter.frequency.exponentialRampToValueAtTime(2000, now + 0.4);
            
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.12, now + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
            
            osc.start(now);
            osc.stop(now + 0.6);
        } else if (type === 'scan') {
            // Double scan sonar chime
            const osc1 = ctx.createOscillator();
            const gain1 = ctx.createGain();
            osc1.connect(gain1);
            gain1.connect(ctx.destination);
            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(880, now); // A5
            gain1.gain.setValueAtTime(0, now);
            gain1.gain.linearRampToValueAtTime(0.05, now + 0.01);
            gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
            osc1.start(now);
            osc1.stop(now + 0.2);
            
            setTimeout(() => {
                if (!ctx) return;
                const osc2 = ctx.createOscillator();
                const gain2 = ctx.createGain();
                osc2.connect(gain2);
                gain2.connect(ctx.destination);
                osc2.type = 'sine';
                osc2.frequency.setValueAtTime(1174.66, ctx.currentTime); // D6
                gain2.gain.setValueAtTime(0, ctx.currentTime);
                gain2.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.01);
                gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
                osc2.start(ctx.currentTime);
                osc2.stop(ctx.currentTime + 0.3);
            }, 100);
        } else if (type === 'error') {
            // Deep buzzing caution alarm
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, now); // D3
            osc.frequency.linearRampToValueAtTime(110, now + 0.3);
            
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.08, now + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
            
            osc.start(now);
            osc.stop(now + 0.3);
        }
    } catch (e) {
        console.warn("AudioContext playback failed or blocked by browser policy:", e);
    }
}
