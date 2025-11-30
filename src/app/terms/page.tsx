
export default function TermsPage() {
    return (
      <div className="container py-24 sm:py-32">
        <article className="prose prose-invert mx-auto max-w-3xl">
          <h1 className="font-headline text-4xl">Terms of Service</h1>
          <p className="lead">
            Welcome to GitAssist. By using our service, you agree to these terms. Please read them carefully.
          </p>
  
          <h2>1. Use of Our Service</h2>
          <p>
            You must follow any policies made available to you within the Service. You may use our Service only as permitted by law. We may suspend or stop providing our Service to you if you do not comply with our terms or policies or if we are investigating suspected misconduct.
          </p>
  
          <h2>2. Your GitAssist Account</h2>
          <p>
            You need a GitHub account to use our Service. You are responsible for safeguarding your account, so use a strong password and limit its use to this account. We cannot and will not be liable for any loss or damage arising from your failure to comply with the above.
          </p>
  
          <h2>3. Content and Conduct</h2>
          <p>
            You are responsible for your conduct and the content you upload to GitHub via our Service. We are not responsible for the content posted on the Service. You agree not to misuse the Service or help anyone else to do so.
          </p>
  
          <h2>4. AI Features</h2>
          <p>
            The AI-generated content (e.g., commit messages) is provided on an "as-is" basis without warranties of any kind. You are responsible for reviewing and validating the AI-generated content before use.
          </p>
  
          <h2>5. Disclaimers and Limitation of Liability</h2>
          <p>
            The Service is provided "as is." To the fullest extent permitted by law, we disclaim all warranties, express or implied, in connection with the Service and your use thereof. We will not be liable for any indirect, incidental, special, consequential or punitive damages, or any loss of profits or revenues.
          </p>
  
          <h2>6. Changes to These Terms</h2>
          <p>
            We may modify these terms or any additional terms that apply to a Service to, for example, reflect changes to the law or changes to our Services. You should look at the terms regularly.
          </p>
  
          <h2>7. Contact Us</h2>
          <p>
            If you have any questions about these Terms, please contact us at <a href="mailto:legal@gitassist.com">legal@gitassist.com</a>.
          </p>
          <p><small>Last updated: {new Date().toLocaleDateString()}</small></p>
        </article>
      </div>
    );
  }
