import React, { useState, useEffect, useRef } from 'react';

const StandupRandomizer = () => {
  const [members, setMembers] = useState([
    { id: 1, name: 'ป๊อก', avatar: '👩‍💻🧑‍💻', available: true },
    { id: 2, name: 'โฮป', avatar: '🧑‍💻', available: true },
    { id: 3, name: 'ต้อม', avatar: '🧑‍💻', available: true },
    { id: 4, name: 'ก้อง', avatar: '🧑‍💻', available: true },  
  ]);
  
  const [shuffledOrder, setShuffledOrder] = useState([]);
  const [currentSpeaker, setCurrentSpeaker] = useState(0);
  const [isShuffling, setIsShuffling] = useState(false);
  const [shuffleDisplay, setShuffleDisplay] = useState([]);
  const [timer, setTimer] = useState(120);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [totalTime, setTotalTime] = useState(0);
  const [meetingStarted, setMeetingStarted] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🧑‍💻');
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [firstPickStats, setFirstPickStats] = useState({});
  const [soundEnabled, setSoundEnabled] = useState(true);
  const timerRef = useRef(null);
  const totalTimerRef = useRef(null);
  const audioContext = useRef(null);

  const avatarOptions = ['🧑‍💻', '👩‍💻', '👨‍🔬', '👩‍🎨', '🧑‍🚀', '👨‍💼', '👩‍💼', '🧑‍🎤', '👨‍🍳', '👩‍⚕️', '🦸‍♂️', '🦸‍♀️', '🧙‍♂️', '🧙‍♀️', '🐱', '🐶', '🦊', '🐼'];

  const playSound = (type) => {
    if (!soundEnabled) return;
    
    if (!audioContext.current) {
      audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    const ctx = audioContext.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    if (type === 'tick') {
      oscillator.frequency.value = 800;
      gainNode.gain.value = 0.1;
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.05);
    } else if (type === 'done') {
      oscillator.frequency.value = 523.25;
      gainNode.gain.value = 0.2;
      oscillator.start();
      setTimeout(() => {
        oscillator.frequency.value = 659.25;
      }, 150);
      setTimeout(() => {
        oscillator.frequency.value = 783.99;
      }, 300);
      oscillator.stop(ctx.currentTime + 0.5);
    } else if (type === 'warning') {
      oscillator.frequency.value = 440;
      gainNode.gain.value = 0.15;
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.2);
    } else if (type === 'complete') {
      oscillator.frequency.value = 880;
      gainNode.gain.value = 0.2;
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.3);
    }
  };

  useEffect(() => {
    if (isTimerRunning && timer > 0) {
      timerRef.current = setInterval(() => {
        setTimer(prev => {
          if (prev <= 31 && prev > 1 && prev % 10 === 0) {
            playSound('warning');
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timer === 0 && isTimerRunning) {
      playSound('complete');
      setIsTimerRunning(false);
    }
    
    return () => clearInterval(timerRef.current);
  }, [isTimerRunning, timer]);

  useEffect(() => {
    if (meetingStarted) {
      totalTimerRef.current = setInterval(() => {
        setTotalTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(totalTimerRef.current);
  }, [meetingStarted]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const shuffleArray = (array) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const startShuffle = () => {
    const availableMembers = members.filter(m => m.available);
    if (availableMembers.length === 0) return;
    
    setIsShuffling(true);
    setMeetingStarted(false);
    setTotalTime(0);
    setCurrentSpeaker(0);
    
    let iterations = 0;
    const maxIterations = 20;
    
    const shuffleInterval = setInterval(() => {
      const randomOrder = shuffleArray(availableMembers);
      setShuffleDisplay(randomOrder);
      playSound('tick');
      iterations++;
      
      if (iterations >= maxIterations) {
        clearInterval(shuffleInterval);
        const finalOrder = shuffleArray(availableMembers);
        setShuffledOrder(finalOrder);
        setShuffleDisplay(finalOrder);
        setIsShuffling(false);
        setMeetingStarted(true);
        setTimer(120);
        playSound('done');
        
        // Update first pick stats
        const firstPerson = finalOrder[0];
        setFirstPickStats(prev => ({
          ...prev,
          [firstPerson.id]: (prev[firstPerson.id] || 0) + 1
        }));
      }
    }, 100);
  };

  const nextSpeaker = () => {
    if (currentSpeaker < shuffledOrder.length - 1) {
      setCurrentSpeaker(prev => prev + 1);
      setTimer(120);
      setIsTimerRunning(false);
    } else {
      // Meeting complete
      const meetingRecord = {
        date: new Date().toLocaleDateString('th-TH'),
        time: new Date().toLocaleTimeString('th-TH'),
        duration: totalTime,
        participants: shuffledOrder.map(m => m.name),
        firstPick: shuffledOrder[0]?.name
      };
      setHistory(prev => [meetingRecord, ...prev].slice(0, 10));
      setMeetingStarted(false);
      clearInterval(totalTimerRef.current);
      playSound('complete');
    }
  };

  const skipSpeaker = () => {
    nextSpeaker();
  };

  const toggleAvailability = (id) => {
    setMembers(prev => prev.map(m => 
      m.id === id ? { ...m, available: !m.available } : m
    ));
  };

  const addMember = () => {
    if (newMemberName.trim()) {
      const newId = Math.max(...members.map(m => m.id), 0) + 1;
      setMembers(prev => [...prev, {
        id: newId,
        name: newMemberName.trim(),
        avatar: selectedEmoji,
        available: true
      }]);
      setNewMemberName('');
      setShowAddModal(false);
    }
  };

  const removeMember = (id) => {
    setMembers(prev => prev.filter(m => m.id !== id));
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a3e 50%, #0f0f23 100%)',
      fontFamily: "'Kanit', 'Prompt', sans-serif",
      color: '#e0e0ff',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated background particles */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 0
      }}>
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: Math.random() * 4 + 2 + 'px',
              height: Math.random() * 4 + 2 + 'px',
              background: `rgba(${100 + Math.random() * 155}, ${100 + Math.random() * 155}, 255, ${0.3 + Math.random() * 0.4})`,
              borderRadius: '50%',
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
              animation: `float ${10 + Math.random() * 20}s ease-in-out infinite`,
              animationDelay: `-${Math.random() * 20}s`
            }}
          />
        ))}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600;700&display=swap');
        
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.3; }
          25% { transform: translateY(-30px) translateX(10px); opacity: 0.6; }
          50% { transform: translateY(-10px) translateX(-10px); opacity: 0.4; }
          75% { transform: translateY(-40px) translateX(5px); opacity: 0.7; }
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 20px rgba(99, 102, 241, 0.4); }
          50% { transform: scale(1.02); box-shadow: 0 0 40px rgba(99, 102, 241, 0.6); }
        }
        
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px) rotate(-1deg); }
          75% { transform: translateX(5px) rotate(1deg); }
        }
        
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(251, 191, 36, 0.4); }
          50% { box-shadow: 0 0 40px rgba(251, 191, 36, 0.8); }
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .card {
          background: rgba(30, 30, 60, 0.8);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(99, 102, 241, 0.3);
          border-radius: 20px;
          padding: 24px;
          transition: all 0.3s ease;
        }
        
        .card:hover {
          border-color: rgba(99, 102, 241, 0.6);
          transform: translateY(-2px);
        }
        
        .btn {
          padding: 12px 24px;
          border: none;
          border-radius: 12px;
          font-family: inherit;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 16px;
        }
        
        .btn:hover {
          transform: translateY(-2px);
        }
        
        .btn:active {
          transform: translateY(0);
        }
        
        .btn-primary {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
          box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);
        }
        
        .btn-primary:hover {
          box-shadow: 0 6px 20px rgba(99, 102, 241, 0.6);
        }
        
        .btn-secondary {
          background: rgba(99, 102, 241, 0.2);
          color: #a5b4fc;
          border: 1px solid rgba(99, 102, 241, 0.4);
        }
        
        .btn-secondary:hover {
          background: rgba(99, 102, 241, 0.3);
        }
        
        .btn-danger {
          background: rgba(239, 68, 68, 0.2);
          color: #fca5a5;
          border: 1px solid rgba(239, 68, 68, 0.4);
        }
        
        .btn-danger:hover {
          background: rgba(239, 68, 68, 0.3);
        }
        
        .btn-success {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
        }
        
        .member-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: rgba(40, 40, 80, 0.6);
          border-radius: 12px;
          border: 1px solid rgba(99, 102, 241, 0.2);
          transition: all 0.2s ease;
        }
        
        .member-card:hover {
          background: rgba(50, 50, 100, 0.6);
          border-color: rgba(99, 102, 241, 0.4);
        }
        
        .member-card.unavailable {
          opacity: 0.5;
          background: rgba(30, 30, 50, 0.4);
        }
        
        .member-card.current {
          background: linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(245, 158, 11, 0.2) 100%);
          border-color: rgba(251, 191, 36, 0.6);
          animation: glow 2s ease-in-out infinite;
        }
        
        .member-card.done {
          background: rgba(16, 185, 129, 0.1);
          border-color: rgba(16, 185, 129, 0.4);
        }
        
        .shuffle-card {
          animation: shake 0.1s ease-in-out infinite;
        }
        
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
        }
        
        .modal {
          background: linear-gradient(135deg, #1e1e3e 0%, #2a2a5e 100%);
          border: 1px solid rgba(99, 102, 241, 0.4);
          border-radius: 20px;
          padding: 32px;
          
          width: 90%;
          animation: slideIn 0.3s ease;
        }
        
        input {
          width: 100%;
          padding: 12px 16px;
          background: rgba(30, 30, 60, 0.8);
          border: 1px solid rgba(99, 102, 241, 0.3);
          border-radius: 12px;
          color: #e0e0ff;
          font-family: inherit;
          font-size: 16px;
          outline: none;
          transition: all 0.2s ease;
          box-sizing: border-box;
        }
        
        input:focus {
          border-color: rgba(99, 102, 241, 0.8);
          box-shadow: 0 0 20px rgba(99, 102, 241, 0.2);
        }
        
        input::placeholder {
          color: rgba(160, 160, 200, 0.6);
        }
        
        .timer-ring {
          position: relative;
          width: 200px;
          height: 200px;
        }
        
        .timer-ring svg {
          transform: rotate(-90deg);
        }
        
        .timer-ring circle {
          fill: none;
          stroke-width: 8;
        }
        
        .timer-ring .bg {
          stroke: rgba(99, 102, 241, 0.2);
        }
        
        .timer-ring .progress {
          stroke: url(#timerGradient);
          stroke-linecap: round;
          transition: stroke-dashoffset 1s linear;
        }
        
        .emoji-picker {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 12px;
        }
        
        .emoji-btn {
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(40, 40, 80, 0.6);
          border: 2px solid transparent;
          border-radius: 10px;
          cursor: pointer;
          font-size: 24px;
          transition: all 0.2s ease;
        }
        
        .emoji-btn:hover {
          background: rgba(60, 60, 120, 0.6);
          transform: scale(1.1);
        }
        
        .emoji-btn.selected {
          border-color: #6366f1;
          background: rgba(99, 102, 241, 0.2);
        }
      `}</style>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{
            fontSize: '48px',
            fontWeight: '700',
            background: 'linear-gradient(135deg, #a5b4fc 0%, #c4b5fd 50%, #f0abfc 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '8px',
            textShadow: '0 0 40px rgba(165, 180, 252, 0.3)'
          }}>
            🎲 Standup Randomizer
          </h1>
          <p style={{ color: 'rgba(165, 180, 252, 0.7)', fontSize: '18px' }}>
            สุ่มลำดับอัพเดทประจำวัน • ทำให้ทุก Meeting สนุกขึ้น
          </p>
        </div>

        {/* Top Controls */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <button 
            className="btn btn-secondary"
            onClick={() => setSoundEnabled(!soundEnabled)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            {soundEnabled ? '🔊' : '🔇'} เสียง
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => setShowHistory(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            📋 ประวัติ
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => setShowStats(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            📊 สถิติ
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
          {/* Team Members Panel */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#c4b5fd' }}>👥 ทีมงาน</h2>
              <button 
                className="btn btn-primary"
                onClick={() => setShowAddModal(true)}
                style={{ padding: '8px 16px', fontSize: '14px' }}
              >
                + เพิ่ม
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {members.map(member => (
                <div 
                  key={member.id}
                  className={`member-card ${!member.available ? 'unavailable' : ''}`}
                >
                  <span style={{ fontSize: '32px' }}>{member.avatar}</span>
                  <span style={{ flex: 1, fontSize: '16px', fontWeight: '500' }}>{member.name}</span>
                  <button
                    onClick={() => toggleAvailability(member.id)}
                    style={{
                      padding: '6px 12px',
                      background: member.available ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                      border: `1px solid ${member.available ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
                      borderRadius: '8px',
                      color: member.available ? '#6ee7b7' : '#fca5a5',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}
                  >
                    {member.available ? '✓ พร้อม' : 'ไม่อยู่'}
                  </button>
                  <button
                    onClick={() => removeMember(member.id)}
                    style={{
                      padding: '6px 10px',
                      background: 'transparent',
                      border: 'none',
                      color: 'rgba(252, 165, 165, 0.6)',
                      cursor: 'pointer',
                      fontSize: '16px',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={e => e.target.style.color = '#fca5a5'}
                    onMouseOut={e => e.target.style.color = 'rgba(252, 165, 165, 0.6)'}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            
            <div style={{ marginTop: '16px', textAlign: 'center', color: 'rgba(165, 180, 252, 0.6)', fontSize: '14px' }}>
              พร้อม {members.filter(m => m.available).length} / {members.length} คน
            </div>
          </div>

          {/* Shuffle Panel */}
          <div className="card" style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#c4b5fd', marginBottom: '20px' }}>🎰 สุ่มลำดับ</h2>
            
            {!meetingStarted && shuffledOrder.length === 0 && !isShuffling && (
              <div style={{ padding: '40px 0' }}>
                <div style={{ fontSize: '80px', marginBottom: '24px' }}>🎲</div>
                <button 
                  className="btn btn-primary"
                  onClick={startShuffle}
                  style={{ 
                    fontSize: '20px', 
                    padding: '16px 48px',
                    animation: 'pulse 2s ease-in-out infinite'
                  }}
                  disabled={members.filter(m => m.available).length === 0}
                >
                  เริ่มสุ่ม!
                </button>
              </div>
            )}
            
            {isShuffling && (
              <div style={{ padding: '20px 0' }}>
                <div style={{ 
                  fontSize: '24px', 
                  marginBottom: '16px',
                  color: '#fbbf24'
                }}>
                  🎰 กำลังสุ่ม...
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {shuffleDisplay.map((member, idx) => (
                    <div 
                      key={idx}
                      className="member-card shuffle-card"
                      style={{ justifyContent: 'center' }}
                    >
                      <span style={{ fontSize: '24px' }}>{member.avatar}</span>
                      <span style={{ fontWeight: '500' }}>{member.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {meetingStarted && shuffledOrder.length > 0 && (
              <div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                  {shuffledOrder.map((member, idx) => (
                    <div 
                      key={member.id}
                      className={`member-card ${idx === currentSpeaker ? 'current' : idx < currentSpeaker ? 'done' : ''}`}
                      style={{ 
                        animation: `slideIn 0.3s ease ${idx * 0.1}s both`,
                        justifyContent: 'flex-start'
                      }}
                    >
                      <span style={{ 
                        width: '28px', 
                        height: '28px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        background: idx === currentSpeaker ? 'rgba(251, 191, 36, 0.3)' : idx < currentSpeaker ? 'rgba(16, 185, 129, 0.3)' : 'rgba(99, 102, 241, 0.2)',
                        borderRadius: '50%',
                        fontSize: '14px',
                        fontWeight: '600'
                      }}>
                        {idx < currentSpeaker ? '✓' : idx + 1}
                      </span>
                      <span style={{ fontSize: '28px' }}>{member.avatar}</span>
                      <span style={{ fontWeight: '500', flex: 1, textAlign: 'left' }}>{member.name}</span>
                      {idx === currentSpeaker && (
                        <span style={{ 
                          background: 'rgba(251, 191, 36, 0.3)',
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: '#fbbf24'
                        }}>
                          กำลังพูด
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                  <button className="btn btn-secondary" onClick={skipSpeaker}>
                    ⏭️ ข้าม
                  </button>
                  <button className="btn btn-success" onClick={nextSpeaker}>
                    {currentSpeaker < shuffledOrder.length - 1 ? '✓ คนถัดไป' : '🎉 จบ Meeting'}
                  </button>
                </div>
              </div>
            )}
            
            {!meetingStarted && shuffledOrder.length > 0 && !isShuffling && (
              <div style={{ padding: '20px 0' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
                <div style={{ fontSize: '20px', color: '#6ee7b7', marginBottom: '16px' }}>Meeting เสร็จสิ้น!</div>
                <div style={{ color: 'rgba(165, 180, 252, 0.7)', marginBottom: '24px' }}>
                  ใช้เวลาทั้งหมด {formatTime(totalTime)}
                </div>
                <button className="btn btn-primary" onClick={startShuffle}>
                  🔄 เริ่มใหม่
                </button>
              </div>
            )}
          </div>

          {/* Timer Panel */}
          <div className="card" style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#c4b5fd', marginBottom: '20px' }}>⏱️ จับเวลา</h2>
            
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
              <div className="timer-ring">
                <svg width="200" height="200" viewBox="0 0 200 200">
                  <defs>
                    <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="50%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#c084fc" />
                    </linearGradient>
                  </defs>
                  <circle className="bg" cx="100" cy="100" r="90" />
                  <circle 
                    className="progress" 
                    cx="100" 
                    cy="100" 
                    r="90"
                    strokeDasharray={2 * Math.PI * 90}
                    strokeDashoffset={2 * Math.PI * 90 * (1 - timer / 120)}
                  />
                </svg>
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  fontSize: '48px',
                  fontWeight: '700',
                  color: timer <= 30 ? '#f87171' : '#e0e0ff',
                  fontVariantNumeric: 'tabular-nums'
                }}>
                  {formatTime(timer)}
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '24px' }}>
              <button 
                className={`btn ${isTimerRunning ? 'btn-danger' : 'btn-success'}`}
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                disabled={!meetingStarted}
              >
                {isTimerRunning ? '⏸️ หยุด' : '▶️ เริ่ม'}
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => { setTimer(120); setIsTimerRunning(false); }}
              >
                🔄 รีเซ็ต
              </button>
            </div>
            
            <div style={{ 
              padding: '16px', 
              background: 'rgba(99, 102, 241, 0.1)', 
              borderRadius: '12px',
              border: '1px solid rgba(99, 102, 241, 0.2)'
            }}>
              <div style={{ fontSize: '14px', color: 'rgba(165, 180, 252, 0.7)', marginBottom: '4px' }}>
                เวลารวม Meeting
              </div>
              <div style={{ fontSize: '32px', fontWeight: '600', color: '#a5b4fc', fontVariantNumeric: 'tabular-nums' }}>
                {formatTime(totalTime)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '24px', fontWeight: '600', color: '#c4b5fd', marginBottom: '20px' }}>
              ➕ เพิ่มสมาชิกใหม่
            </h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(165, 180, 252, 0.8)' }}>
                ชื่อ
              </label>
              <input
                type="text"
                value={newMemberName}
                onChange={e => setNewMemberName(e.target.value)}
                placeholder="ใส่ชื่อสมาชิก..."
                onKeyPress={e => e.key === 'Enter' && addMember()}
              />
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(165, 180, 252, 0.8)' }}>
                เลือกอวาตาร์
              </label>
              <div className="emoji-picker">
                {avatarOptions.map(emoji => (
                  <button
                    key={emoji}
                    className={`emoji-btn ${selectedEmoji === emoji ? 'selected' : ''}`}
                    onClick={() => setSelectedEmoji(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowAddModal(false)}>
                ยกเลิก
              </button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={addMember}>
                เพิ่มสมาชิก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistory && (
        <div className="modal-overlay" onClick={() => setShowHistory(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <h3 style={{ fontSize: '24px', fontWeight: '600', color: '#c4b5fd', marginBottom: '20px' }}>
              📋 ประวัติ Meeting
            </h3>
            
            {history.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(165, 180, 252, 0.6)' }}>
                ยังไม่มีประวัติ Meeting
              </div>
            ) : (
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {history.map((record, idx) => (
                  <div 
                    key={idx}
                    style={{
                      padding: '16px',
                      background: 'rgba(40, 40, 80, 0.6)',
                      borderRadius: '12px',
                      marginBottom: '12px',
                      border: '1px solid rgba(99, 102, 241, 0.2)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontWeight: '600', color: '#a5b4fc' }}>{record.date}</span>
                      <span style={{ color: 'rgba(165, 180, 252, 0.6)' }}>{record.time}</span>
                    </div>
                    <div style={{ fontSize: '14px', color: 'rgba(165, 180, 252, 0.8)', marginBottom: '4px' }}>
                      ⏱️ {formatTime(record.duration)} • 👥 {record.participants.length} คน
                    </div>
                    <div style={{ fontSize: '13px', color: 'rgba(165, 180, 252, 0.6)' }}>
                      คนแรก: {record.firstPick}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <button 
              className="btn btn-secondary" 
              style={{ width: '100%', marginTop: '16px' }} 
              onClick={() => setShowHistory(false)}
            >
              ปิด
            </button>
          </div>
        </div>
      )}

      {/* Stats Modal */}
      {showStats && (
        <div className="modal-overlay" onClick={() => setShowStats(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '24px', fontWeight: '600', color: '#c4b5fd', marginBottom: '20px' }}>
              📊 สถิติ "โดนเรียกคนแรก"
            </h3>
            
            {Object.keys(firstPickStats).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(165, 180, 252, 0.6)' }}>
                ยังไม่มีสถิติ
              </div>
            ) : (
              <div>
                {members
                  .filter(m => firstPickStats[m.id])
                  .sort((a, b) => (firstPickStats[b.id] || 0) - (firstPickStats[a.id] || 0))
                  .map((member, idx) => (
                    <div 
                      key={member.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px',
                        background: idx === 0 ? 'rgba(251, 191, 36, 0.1)' : 'rgba(40, 40, 80, 0.4)',
                        borderRadius: '10px',
                        marginBottom: '8px',
                        border: idx === 0 ? '1px solid rgba(251, 191, 36, 0.3)' : '1px solid transparent'
                      }}
                    >
                      <span style={{ fontSize: '24px' }}>
                        {idx === 0 ? '🏆' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : member.avatar}
                      </span>
                      <span style={{ flex: 1, fontWeight: '500' }}>{member.name}</span>
                      <span style={{ 
                        background: 'rgba(99, 102, 241, 0.2)',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '14px',
                        fontWeight: '600'
                      }}>
                        {firstPickStats[member.id]} ครั้ง
                      </span>
                    </div>
                  ))}
              </div>
            )}
            
            <button 
              className="btn btn-secondary" 
              style={{ width: '100%', marginTop: '16px' }} 
              onClick={() => setShowStats(false)}
            >
              ปิด
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StandupRandomizer;
