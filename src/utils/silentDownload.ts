export const triggerSilentDownload = (url: string) => {
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.src = url;
  document.body.appendChild(iframe);
  
  // Remove the iframe after 10 seconds to clean up
  setTimeout(() => {
    document.body.removeChild(iframe);
  }, 10000);
};
