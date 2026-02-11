import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { rewardsAPI } from '../utils/api';
import { Camera, Gift, TrendingUp, Sparkles, CheckCircle, X } from 'lucide-react';

const RedeemPoints = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [earnedCredits, setEarnedCredits] = useState(0);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (error) {
      console.error('Camera access denied:', error);
      alert('Please allow camera access to submit bottles');
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
  };

  const handleSubmitBottle = async () => {
    if (submitting) return;
    
    setSubmitting(true);
    
    try {
      const response = await rewardsAPI.submitBottle();
      
      if (response.data.success) {
        setEarnedCredits(response.data.credits_earned);
        updateUser(response.data.user);
        setShowSuccess(true);
        
        setTimeout(() => {
          setShowSuccess(false);
        }, 3000);
      }
    } catch (error) {
      alert('Failed to submit bottle. Please try again.');
    }
    
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-darker overflow-hidden">
      {/* Header */}
      <header className="bg-dark border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Redeem Points</h1>
            <p className="text-sm text-gray-400">Submit bottles to earn credits</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 border border-primary rounded-full px-4 py-2">
              <span className="text-primary font-bold text-lg">{user?.credits || 0}</span>
              <span className="text-gray-400 ml-2 text-sm">Credits</span>
            </div>
            
            <button
              onClick={() => navigate('/store')}
              className="bg-card border border-gray-700 rounded-full px-4 py-2 text-white hover:border-primary transition-colors flex items-center gap-2"
            >
              <Gift className="w-4 h-4" />
              <span>Store</span>
            </button>

            <button
              onClick={() => navigate('/dashboard')}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 py-8 h-[calc(100vh-88px)] flex flex-col">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
          {/* Camera Section */}
          <div className="bg-card rounded-xl border border-gray-800 p-6 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <Camera className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold text-white">Camera Feed</h2>
              {cameraActive && (
                <motion.div
                  className="ml-auto w-3 h-3 bg-red-500 rounded-full"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                />
              )}
            </div>

            <div className="flex-1 bg-darker rounded-lg overflow-hidden relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              
              {!cameraActive && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-gray-500">Activating camera...</p>
                </div>
              )}
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSubmitBottle}
              disabled={submitting || !cameraActive}
              className="mt-4 w-full bg-primary text-dark font-bold py-4 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-dark border-t-transparent rounded-full"
                  />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Submit Bottle (+100 Credits)</span>
                </>
              )}
            </motion.button>
          </div>

          {/* Stats Section */}
          <div className="space-y-6">
            <div className="bg-card rounded-xl border border-gray-800 p-6">
              <div className="flex items-center gap-3 mb-6">
                <TrendingUp className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold text-white">Your Stats</h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-darker rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-1">Total Credits</p>
                  <p className="text-3xl font-bold text-primary">{user?.credits || 0}</p>
                </div>
                
                <div className="bg-darker rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-1">Bottles Submitted</p>
                  <p className="text-3xl font-bold text-white">{user?.bottles_submitted || 0}</p>
                </div>
                
                <div className="bg-darker rounded-lg p-4 col-span-2">
                  <p className="text-gray-400 text-sm mb-1">Total Earned</p>
                  <p className="text-3xl font-bold text-green-500">{user?.total_earned || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-primary/20 to-secondary/20 rounded-xl border border-primary/50 p-6">
              <h3 className="text-lg font-bold text-white mb-3">How It Works</h3>
              <div className="space-y-3 text-sm text-gray-300">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-dark flex items-center justify-center font-bold flex-shrink-0">1</div>
                  <p>Show your empty plastic bottle to the camera</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-dark flex items-center justify-center font-bold flex-shrink-0">2</div>
                  <p>Click "Submit Bottle" to verify and earn credits</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-dark flex items-center justify-center font-bold flex-shrink-0">3</div>
                  <p>Earn 100 credits per bottle to redeem rewards!</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Animation */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="bg-card rounded-xl p-8 text-center max-w-md"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
              >
                <CheckCircle className="w-20 h-20 text-primary mx-auto mb-4" />
              </motion.div>
              <h3 className="text-2xl font-bold text-white mb-2">Bottle Submitted!</h3>
              <p className="text-gray-400 mb-4">You earned</p>
              <p className="text-5xl font-bold text-primary mb-6">+{earnedCredits}</p>
              <p className="text-gray-400">Credits added to your account</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RedeemPoints;
