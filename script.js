document.getElementById("n8nForm").addEventListener("submit", async function(e) {
  e.preventDefault();

  const ideas = document.getElementById("ideas").value;
  const topic = document.getElementById("topic").value;
  const keywords = document.getElementById("keywords").value;

  // Basic validation
  if (!ideas.trim() || !topic.trim()) {
    alert("Please provide both ideas and a topic for your blog.");
    return;
  }

  const payload = { ideas, topic, keywords };

  // Show status message, hide response
  const statusElement = document.getElementById("statusMessage");
  statusElement.textContent = "Generating blog, please wait...";
  statusElement.classList.remove("hidden");
  document.getElementById("responseBox").classList.add("hidden");

  try {
    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const res = await fetch("https://primary-production-0f282.up.railway.app/webhook/6e2c6b4a-29d7-47b8-b760-0b0678bfb032", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Server returned ${res.status}: ${res.statusText}`);
    }

    const data = await res.text();

    document.getElementById("resTopic").innerText = topic || "Generated Blog";
    document.getElementById("resBlog").innerHTML = formatBlogContent(data) || "No blog returned.";

    // Hide status message, show response
    statusElement.classList.add("hidden");
    document.getElementById("responseBox").classList.remove("hidden");

  } catch (err) {
    console.error("Fetch error:", err);
    
    // Show error in status message
    statusElement.textContent = "Error: " + err.message + 
      ". Please check that your n8n server is running and the webhook URL is correct.";
      
    // Keep status message visible, ensure response is hidden
    document.getElementById("responseBox").classList.add("hidden");
  }
});

// Improved blog content formatting function
function formatBlogContent(text) {
  if (!text) return '';
  
  console.log("Raw response:", text);
  
  // Handle the specific format shown in the image
  if (text.includes('{ "blog": "=') && text.includes('{ "Title":')) {
    try {
      // Extract the JSON part after the "=" sign
      const jsonStart = text.indexOf('{ "Title":');
      if (jsonStart !== -1) {
        const jsonString = text.substring(jsonStart);
        const jsonData = JSON.parse(jsonString);
        
        if (jsonData.Title && jsonData.Description) {
          return `<h1>${jsonData.Title}</h1><p>${jsonData.Description}</p>`;
        }
      }
    } catch (e) {
      console.error("Error parsing JSON:", e);
      // If parsing fails, fall back to text extraction
    }
  }
  
  // Try to extract JSON from malformed responses
  const jsonMatch = text.match(/\{[\s\S]*"Title":\s*"([^"]+)"[\s\S]*"Description":\s*"([^"]+)"[\s\S]*\}/);
  if (jsonMatch && jsonMatch.length >= 3) {
    return `<h1>${jsonMatch[1]}</h1><p>${jsonMatch[2]}</p>`;
  }
  
  // Try another pattern for JSON extraction
  const titleMatch = text.match(/"Title":\s*"([^"]+)"/);
  const descMatch = text.match(/"Description":\s*"([^"]+)"/);
  
  if (titleMatch && descMatch) {
    return `<h1>${titleMatch[1]}</h1><p>${descMatch[1]}</p>`;
  }
  
  // If all else fails, just clean up the text and display it
  text = text.replace(/\{[\s\S]*?"blog":\s*"=[\s\S]*?\}/, '');
  text = text.replace(/\{[\s\S]*?"Title":[\s\S]*?"Description":[\s\S]*?\}/, '');
  text = text.replace(/\\"/g, '"');
  text = text.replace(/\\n/g, '\n');
  
  return formatMarkdownContent(text);
}

// Helper function to format markdown content
function formatMarkdownContent(text) {
  if (!text) return '';
  
  // Convert markdown-style headings to HTML
  text = text.replace(/^# (.*$)/gim, '<h1>$1</h1>');
  text = text.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  text = text.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  text = text.replace(/^#### (.*$)/gim, '<h4>$1</h4>');
  
  // Convert bold and italic text
  text = text.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
  text = text.replace(/\*(.*?)\*/gim, '<em>$1</em>');
  
  // Convert line breaks to paragraphs
  let paragraphs = text.split(/\n\s*\n/);
  text = paragraphs.map(p => {
    p = p.trim();
    if (p === '') return '';
    // Don't wrap headings in paragraphs
    if (p.startsWith('<h')) return p;
    return `<p>${p}</p>`;
  }).join('');
  
  // Convert lists
  text = text.replace(/^\s*[\-\*] (.*$)/gim, '<li>$1</li>');
  text = text.replace(/(<li>.*<\/li>)/gs, function(match) {
    return `<ul>${match}</ul>`;
  });
  
  // Convert code blocks
  text = text.replace(/```([^`]*)```/g, '<pre>$1</pre>');
  text = text.replace(/`([^`]*)`/g, '<code>$1</code>');
  
  // Convert blockquotes
  text = text.replace(/^>\s(.*$)/gim, '<blockquote>$1</blockquote>');
  
  return text;
}

// Add copy functionality
document.getElementById('copyButton').addEventListener('click', function() {
  const blogContent = document.getElementById('resBlog').innerText;
  
  navigator.clipboard.writeText(blogContent).then(() => {
    // Show notification
    const notification = document.createElement('div');
    notification.className = 'copy-notification show';
    notification.textContent = 'Blog copied to clipboard!';
    document.body.appendChild(notification);
    
    // Remove notification after 2 seconds
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 2000);
  }).catch(err => {
    console.error('Failed to copy: ', err);
    alert('Failed to copy blog to clipboard. Please try again.');
  });
});