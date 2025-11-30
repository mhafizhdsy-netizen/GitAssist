
export default function PrivacyPage() {
    return (
      <div className="container py-24 sm:py-32">
        <article className="prose prose-invert mx-auto max-w-3xl">
          <h1 className="font-headline text-4xl">Privacy Policy</h1>
          <p className="lead">
            Your privacy is important to us. This Privacy Policy explains how we collect, use, and protect your information.
          </p>
          
          <h2>1. Information We Collect</h2>
          <p>
            When you use GitAssist, we may collect the following information:
            <ul>
              <li><strong>Account Information:</strong> We use Supabase for GitHub authentication. We receive your GitHub username, email address, and avatar URL. We do not store your GitHub password.</li>
              <li><strong>Repository Data:</strong> We temporarily access file content and repository structure to perform uploads and generate commit messages. This data is not stored long-term on our servers.</li>
              <li><strong>Usage Data:</strong> We may collect anonymous data about how you interact with our application to help us improve our services.</li>
            </ul>
          </p>
  
          <h2>2. How We Use Your Information</h2>
          <p>
            We use the information we collect to:
            <ul>
              <li>Provide, operate, and maintain GitAssist.</li>
              <li>Authenticate your GitHub account.</li>
              <li>Process file uploads to your selected repositories.</li>
              <li>Generate AI-powered commit messages.</li>
              <li>Communicate with you, including for customer service and support.</li>
            </ul>
          </p>
  
          <h2>3. Data Security</h2>
          <p>
            We implement a variety of security measures to maintain the safety of your personal information. All communications are encrypted using SSL technology, and access to your data is strictly limited.
          </p>
  
          <h2>4. Third-Party Services</h2>
          <p>
            We use third-party services like Supabase for authentication and database management, and Google's Gemini for AI features. These services have their own privacy policies, which we encourage you to review.
          </p>
  
          <h2>5. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.
          </p>
  
          <h2>6. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at <a href="mailto:privacy@gitassist.com">privacy@gitassist.com</a>.
          </p>
          <p><small>Last updated: {new Date().toLocaleDateString()}</small></p>
        </article>
      </div>
    );
  }
