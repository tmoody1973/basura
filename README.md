# Basura 🗂️

**AI-Powered Government Budget Analysis Platform**

Basura transforms complex government budget documents from any jurisdiction into accessible, interactive experiences through natural language conversations, dynamic visualizations, and intelligent data analysis.

## 🌟 Overview

Basura empowers **students**, **journalists**, and **engaged citizens** to understand public spending across all levels of government—from local city councils to federal agencies—through AI-powered chat and smart visualizations.

### Why "Basura"?

The name "Basura" (Spanish for "trash" or "garbage") playfully references how government budget documents often feel like incomprehensible paperwork to most people. Basura turns this "trash" into treasure by making budget data accessible and actionable for everyone.

## ✨ Key Features

### 🤖 AI-Powered Analysis
- **Natural Language Queries**: Ask questions in plain English about any budget document
- **Multi-Jurisdictional Support**: Analyze city, county, state, and federal budgets
- **Smart Context Awareness**: AI adapts responses based on user type (student, journalist, citizen)
- **Source Citations**: Every answer includes exact page references and document sections

### 📊 Dynamic Visualizations
- **Adaptive Charts**: Automatic chart generation based on your questions
- **Interactive Dashboards**: Drill down into budget categories and departments
- **Comparison Tools**: Side-by-side analysis across different jurisdictions
- **Export Capabilities**: Download charts and data for presentations or articles

### 🎧 AI-Generated Podcasts
- **Personalized Audio Content**: Generate custom podcasts from your budget discoveries
- **Multi-Voice Narration**: Engaging conversations between AI hosts
- **Educational Series**: Learn about government spending through audio storytelling
- **Offline Listening**: Download podcasts for commutes or study sessions

### 💬 Intelligent Chat Interface
- **Conversation Memory**: AI remembers your previous questions and discoveries
- **Smart Suggestions**: Get relevant follow-up questions based on your exploration
- **Real-time Responses**: Stream answers as the AI processes your queries
- **Conversation History**: Save and organize your budget analysis sessions

## 🎯 Built For

### 📚 Students
- **Educational Explanations**: Complex budget concepts explained in simple terms
- **Visual Learning**: Charts and infographics that make data engaging
- **Civics Projects**: Perfect for school assignments and presentations
- **Progressive Learning**: Build understanding step-by-step

### 📰 Journalists
- **Rapid Analysis**: Quickly extract key data points for breaking news
- **Fact Checking**: Verify budget claims with exact source citations
- **Investigative Tools**: Identify trends and anomalies across budget cycles
- **Export Ready**: Professional-grade data and visualizations for articles

### 🏛️ Citizens
- **Personal Impact**: Understand how budgets affect your daily life
- **Tax Implications**: See where your tax dollars are being spent
- **Community Engagement**: Prepare for town halls and city council meetings
- **Advocacy Tools**: Find data to support community initiatives

## 🛠️ Technology Stack

### Frontend
- **Next.js 14** with App Router
- **React 19** with TypeScript
- **Tailwind CSS** with shadcn/ui components
- **Recharts** for data visualization
- **Clerk** for authentication

### AI & Processing
- **Mastra.ai** for agent orchestration
- **OpenAI GPT-4** for natural language processing
- **LlamaParse** for PDF document processing
- **Pinecone** for vector similarity search
- **ElevenLabs v3** for voice synthesis

### Database & Storage
- **Supabase PostgreSQL** with vector extensions
- **Row Level Security** for user data isolation
- **Real-time subscriptions** for live chat updates
- **Storage buckets** for documents and audio files

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or pnpm
- Supabase account
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/basura.git
   cd basura
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Fill in your API keys and database credentials.

4. **Set up the database**
   - Create a new Supabase project
   - Run the migration files in `/supabase/migrations/`
   - Enable the `vector` extension

5. **Start the development server**
   ```bash
   npm run dev
   ```

Visit `http://localhost:3001` to see Basura in action!

## 📖 Usage

### Uploading a Budget Document
1. **Go to the homepage** and drag & drop a PDF budget document
2. **Wait for processing** - Basura will extract and analyze the content
3. **Start asking questions** - Use natural language to explore the data

### Example Questions
- "What's the total budget for education?"
- "How much does the police department spend compared to last year?"
- "Show me a breakdown of infrastructure spending"
- "Which departments had the biggest budget increases?"

### Advanced Features
- **Bookmark conversations** for future reference
- **Generate podcasts** from your discoveries
- **Compare budgets** across different jurisdictions
- **Export data** for presentations or research

## 🔧 Development

### Project Structure
```
basura/
├── app/                    # Next.js App Router
├── components/             # React components (shadcn/ui)
├── lib/
│   ├── mastra/            # AI agent configuration
│   ├── supabase/          # Database client & helpers
│   └── pinecone/          # Vector search setup
├── supabase/
│   └── migrations/        # Database schema
└── docs/                  # Documentation
```

### Key Commands
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run lint     # Run ESLint
npm run typecheck # Run TypeScript checks
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Mastra.ai** for powerful agent orchestration
- **Supabase** for database and storage infrastructure
- **OpenAI** for natural language processing capabilities
- **Vercel** for hosting and deployment
- **shadcn/ui** for beautiful, accessible components

## 📞 Support

- **Documentation**: [docs.basura.app](https://docs.basura.app)
- **Issues**: [GitHub Issues](https://github.com/your-username/basura/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/basura/discussions)
- **Email**: support@basura.app

---

**Made with ❤️ for civic transparency and democratic engagement**

Transform government budget complexity into clear, actionable insights. Because understanding how your tax dollars are spent shouldn't require a PhD in public finance.

**Start exploring with Basura today!** 🚀
