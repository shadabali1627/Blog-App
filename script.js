document.getElementById("n8nForm").addEventListener("submit", async function(e) {
  e.preventDefault();

  const ideas = document.getElementById("ideas").value;
  const topic = document.getElementById("topic").value;
  const keywords = document.getElementById("keywords").value;

  if (!ideas.trim() || !topic.trim()) {
    alert("Please provide both ideas and a topic for your blog.");
    return;
  }

  const payload = { ideas, topic, keywords };
  const statusElement = document.getElementById("statusMessage");
  statusElement.textContent = "Generating blog, please wait... This may take up to 10 minutes.";
  statusElement.classList.remove("hidden");
  document.getElementById("responseBox").classList.add("hidden");

  const submitButton = document.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.textContent = "Processing...";

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 600000);

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

    // We no longer read and display the response
    await res.text();

    // ✅ Only show congratulations message
    statusElement.textContent = "🎉 Congratulations! The blog is generated. Kindly check your Google Drive.";

    // ❌ Removed: showing blog content (resTopic/resBlog/responseBox)
    
  } catch (err) {
    console.error("Fetch error:", err);
    if (err.name === 'AbortError') {
      statusElement.textContent = "Request timed out after 10 minutes. Please try again or check your n8n workflow.";
    } else {
      statusElement.textContent = "Error: " + err.message +
        ". Please check that your n8n server is running and the webhook URL is correct.";
    }
    document.getElementById("responseBox").classList.add("hidden");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Generate Blog";
  }
});
