"""
Servo Motor Control
Controls sorting mechanism servo motor
"""

import RPi.GPIO as GPIO
import time
import logging

logger = logging.getLogger(__name__)


class ServoController:
    """Controls servo motor for bin selection"""
    
    def __init__(self, pin: int = 18, frequency: int = 50):
        """
        Initialize servo controller
        
        Args:
            pin: GPIO pin number (BCM mode)
            frequency: PWM frequency in Hz
        """
        self.pin = pin
        self.frequency = frequency
        self.pwm = None
        self.current_angle = 90  # Start at center
        
        self._setup_gpio()
    
    def _setup_gpio(self):
        """Setup GPIO and PWM"""
        try:
            GPIO.setmode(GPIO.BCM)
            GPIO.setup(self.pin, GPIO.OUT)
            
            self.pwm = GPIO.PWM(self.pin, self.frequency)
            self.pwm.start(0)
            
            logger.info(f"Servo initialized on GPIO pin {self.pin}")
        except Exception as e:
            logger.error(f"GPIO setup failed: {e}")
            raise
    
    def _angle_to_duty_cycle(self, angle: int) -> float:
        """
        Convert angle to PWM duty cycle
        
        Args:
            angle: Target angle (0-180)
            
        Returns:
            Duty cycle percentage
        """
        # Standard servo: 2.5% (0°) to 12.5% (180°)
        return 2.5 + (angle / 180.0) * 10.0
    
    def rotate_to(self, angle: int, speed: float = 1.0):
        """
        Rotate servo to target angle smoothly
        
        Args:
            angle: Target angle (0-180)
            speed: Rotation speed multiplier
        """
        if not 0 <= angle <= 180:
            logger.warning(f"Invalid angle {angle}, clamping to 0-180")
            angle = max(0, min(180, angle))
        
        logger.info(f"Rotating servo from {self.current_angle}° to {angle}°")
        
        # Smooth rotation
        step = 2 if angle > self.current_angle else -2
        
        for pos in range(self.current_angle, angle, step):
            duty = self._angle_to_duty_cycle(pos)
            self.pwm.ChangeDutyCycle(duty)
            time.sleep(0.01 / speed)
        
        # Final position
        duty = self._angle_to_duty_cycle(angle)
        self.pwm.ChangeDutyCycle(duty)
        time.sleep(0.3)
        
        self.current_angle = angle
        
        # Stop PWM signal to prevent jitter
        self.pwm.ChangeDutyCycle(0)
    
    def rotate_to_bin(self, bin_type: str):
        """
        Rotate to predefined bin position
        
        Args:
            bin_type: Type of bin (dry/wet/electronic/processing)
        """
        bin_angles = {
            'dry': 60,
            'wet': 120,
            'electronic': 180,
            'processing': 0
        }
        
        angle = bin_angles.get(bin_type)
        if angle is None:
            logger.warning(f"Unknown bin type: {bin_type}")
            return
        
        logger.info(f"Routing to {bin_type} bin")
        self.rotate_to(angle)
    
    def reset(self):
        """Reset servo to center position"""
        logger.info("Resetting servo to center")
        self.rotate_to(90)
    
    def cleanup(self):
        """Cleanup GPIO resources"""
        if self.pwm:
            self.pwm.stop()
        GPIO.cleanup()
        logger.info("Servo cleanup complete")
    
    def __del__(self):
        """Cleanup on deletion"""
        self.cleanup()
