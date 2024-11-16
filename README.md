# MemeSphinx: MEME Coin Riddles Game

MemeSphinx is an innovative text-based game designed to captivate Web3 enthusiasts. Players solve riddles about MEME coins presented by a mystical Sphinx, with the chance to win MEME coin rewards. Built using cutting-edge technologies such as XMTP and Flow blockchain, MemeSphinx combines fun, engagement, and security to create an unparalleled interactive experience.

---

## 🚀 Git Config and Repository Clone

```bash
# First, increase Git buffer size (required for cloning large repositories)
git config --global http.postBuffer 524288000

# Clone the repository
git clone https://github.com/apac-chainchanger/MemeSphinx.git
```

## 🌟 Key Features

### 🎭 **Interactive Gameplay(with XMTP)**

- **Riddles from the Sphinx**: Encounter the Sphinx, a mystical character that presents clues and riddles about MEME coins.
  - Example: _"This coin is loved by Elon and adored by a certain Shiba Inu."_ (Answer: DOGE)
- **Guess the MEME Coin**: Players have **3 chances** to guess the correct MEME coin and win rewards.

### 💰 **Rewards(with Flow)**

- Correct guesses are rewarded with MEME coins distributed via a smart contract built on the Flow blockchain, leveraging its EVM compatibility introduced in the Crescendo update.
- Flow’s low fees, scalability, and developer-friendly environment made it the ideal choice for integrating MEME coin rewards.
- The smart contract ensures secure, efficient, and transparent reward distribution, fully utilizing Flow's robust ecosystem for seamless execution.

### 🌐 **Cross-Platform Integration**

- **XMTP**: Offers wallet-based communication and verification through Converse.app for secure, identity-driven interactions.
- **Telegram**: Allows broader participation with a consistent experience, albeit without wallet-based verification.

### 🤖 **Advanced Bot Architecture**

- Powered by **GPT-4o**, ensuring natural, dynamic, and engaging interactions.
- Built on XMTP's Message-kit Framework and Telegram’s python-telegram-bot with LangChain.

---

## 🛠️ **How It Works**

### 1. **Start the Game**

- Interact via **XMTP** (Converse.app) or **Telegram**.
- The Sphinx presents a randomized clue about a MEME coin.

### 2. **Guess the MEME Coin**

- Submit your answers directly through the chat interface.
- Three chances per riddle.

### 3. **Win MEME Coin Rewards**

- Correct guesses trigger a smart contract that distributes MEME coins to your wallet securely.

---

## 📂 **Project Directory Structure**

```plaintext
MemeSphinx/
├── Telegram_bot/        # Telegram bot-related code
│   ├── main.py          # Main execution file for the bot
│   ├── bot_logic.py     # Bot game logic
│   └── requirements.txt # Python dependencies
├── XMTP_bot/            # XMTP-based bot code
│   ├── main.js          # Main execution file for the bot
│   ├── bot_logic.js     # Bot game logic
│   └── package.json     # Node.js dependencies
├── contracts/           # Flow blockchain smart contract code
│   ├── MemeSphinx.cdc   # Flow Cadence contract code
├── README.md            # Project documentation
├── LICENSE              # License file
└── .gitignore           # Git ignore file
```

---

## 🚀 **Getting Started**

### **1. Clone the Repository**

```bash
git clone https://github.com/apac-chainchanger/MemeSphinx.git
```

### **2. Install Dependencies**

- **For Telegram Bot**:
  ```bash
  cd Telegram_bot
  pip install -r requirements.txt
  ```
- **For XMTP Bot**:
  ```bash
  cd XMTP_bot
  yarn install
  ```

### **3. Run the Bots**

- **Telegram Bot**:
  ```bash
  python main.py
  ```
- **XMTP Bot**:
  ```bash
  npm start
  ```

### **4. Deploy the Smart Contract**

- Navigate to the `contracts/` directory and deploy the Flow blockchain smart contract using Flow’s development environment.

---

## 🔐 **Security Features**

1. **Wallet Verification**:
   - XMTP ensures wallet-based identity for secure interactions.
2. **Smart Contract**:
   - Whitelisted users and pre-held MEME coins ensure secure reward distribution.
3. **Flow Blockchain**:
   - EVM-compatible, low-cost, and developer-friendly for efficient operations.

---

## 🌏 **Why MemeSphinx?**

MemeSphinx isn’t just a game—it’s a community-driven project aimed at enriching the Web3 ecosystem in Korea and beyond. By combining fun, engagement, and education, we foster active Web3 communities while promoting MEME coins and blockchain technology.

---

## 📄 **License**

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.

---

## 🤝 **Acknowledgments**

Special thanks to our partners:

- **XMTP**: For wallet-based communication technology. [[Github](https://github.com/xmtp) | [Website](https://xmtp.org/)]
- **Flow Blockchain**: For scalable and secure smart contracts. [[Github](https://github.com/onflow) | [Website](https://flow.com
)]

## 👥 Who We Are?

### 🤖 LLM Agent & Bot Developer
> 💬 Contact on Telegram! [@AndrewS0ng](https://t.me/AndrewS0ng)
* 🔌 Developed XMTP & Telegram bot integration
* 🧠 Implemented GPT-4 powered game logic
* 🎤 Created project presentation

### 👨‍💻 SmartContract Developer
> 💬 Contact on Telegram! [@jaysongthedev](https://t.me/jaysongthedev)
* 🔧 Designed & implemented MemeSphinx Token Manager
* 🛡️ Built secure token distribution system
* 🪙 Developed test token contracts (tDOGE, tPEPE, tSHIB)

---
Start your journey with MemeSphinx today and dive into the world of MEME coins!
