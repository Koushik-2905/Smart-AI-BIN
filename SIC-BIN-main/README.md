# Smart AI Waste Segregation System

Edge AI-powered intelligent waste classification system with real-time monitoring dashboard.

## 🎯 Features

- **Real-time Object Detection** using YOLOv8
- **Multi-object Handling** with processing chamber
- **Live Dashboard** with Socket.IO updates
- **Edge AI Processing** on Raspberry Pi
- **Automated Sorting** with servo control
- **Fill-level Monitoring** with ultrasonic sensors
- **🆕 User Authentication** with JWT tokens
- **🆕 Rewards System** - Earn credits by submitting bottles
- **🆕 Redemption Store** - Redeem credits for rewards
- **🆕 Webcam Integration** for bottle verification

## 🏗 Architecture

```
YOLO Detection → MQTT → Node Backend → WebSocket → React Dashboard
     ↓
Hardware Control (Servos, Sensors)
```

## 📦 Components

- **raspberry-pi/** - Edge AI detection & hardware control
- **server/** - Node.js backend with MQTT & WebSocket
- **client/** - React dashboard with real-time updates
- **models/** - Trained YOLO weights
- **dataset/** - Training data
- **docs/** - Documentation & diagrams

## 🚀 Quick Start

### Raspberry Pi Setup
```bash
cd raspberry-pi
pip install -r requirements.txt
cp .env.example .env
python main.py
```

### Server Setup
```bash
cd server
npm install
npm start
```

### Client Setup
```bash
cd client
npm install
npm run dev
```

## 📡 Detection Logic

**Single Object** → Direct to bin (plastic/paper/metal/organic)

**Multiple Objects** → Processing chamber → Sequential segregation

## 🎨 Tech Stack

- **Edge AI**: YOLOv8, OpenCV, Python
- **Backend**: Node.js, Express, MQTT, Socket.IO
- **Frontend**: React, Tailwind CSS, Framer Motion
- **Hardware**: Raspberry Pi, Servos, Ultrasonic sensors

## 📊 Detection JSON Format

```json
{
  "count": 2,
  "objects": [
    {"class": "plastic", "confidence": 0.91},
    {"class": "metal", "confidence": 0.85}
  ],
  "destination": "processing",
  "timestamp": "2026-02-11T12:00:00"
}
```

## 🔧 Configuration

Edit `raspberry-pi/config.py` and `server/.env` for MQTT broker settings.

## 🧠 Pi-Friendly TFLite Training (TF 2.14)

If your Raspberry Pi fails to load `model.tflite` with an operator-version error,
export a compatible model using TensorFlow 2.14 on your laptop/PC:

```bash
python -m venv tf214
source tf214/bin/activate
pip install --upgrade pip
pip install "tensorflow==2.14.0"
python models/train_export_tflite_tf214.py --dataset-root <path-to-dataset>
```

Then copy generated files to `models/model.tflite` and `models/labels.txt`.

## 📄 License

MIT License - Built for innovation

---

**Not just a smart bin. A complete IoT AI system.**
