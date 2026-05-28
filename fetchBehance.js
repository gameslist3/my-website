const urls = [
  'https://www.behance.net/gallery/247258505/EV-App-Mobile-App-Design-Branding-UIUX',
  'https://www.behance.net/gallery/249802005/LakhaniSpices-Storytelling-Through-Motion-UI-UX-Website',
  'https://www.behance.net/gallery/245130859/Shuddh-Swad-Website-Redesign-for-Indian-Snack-Brand',
  'https://www.behance.net/gallery/231284369/Seller-Dashboard',
  'https://www.behance.net/gallery/242375585/Solar-Energy-Website-UIUX-Design-Case-Study',
  'https://www.behance.net/gallery/243702037/Global-Luxury-Handcrafted-Decor-Website-App-Design',
  'https://www.behance.net/gallery/242457195/Zoho-Consulting-Website-Redesign-UIUX-Case-Study',
  'https://www.behance.net/gallery/243824063/Website-Redesign-UI-UX',
  'https://www.behance.net/gallery/233477453/Rental-application-Webdesign'
];

async function fetchMeta() {
  for(let u of urls) {
    try {
      const res = await fetch(u, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
      });
      const text = await res.text();
      const titleMatch = text.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i);
      const imgMatch = text.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
      const descMatch = text.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i);
      
      console.log('---');
      console.log('URL:', u);
      console.log('Title:', titleMatch ? titleMatch[1] : 'Not found');
      console.log('Image:', imgMatch ? imgMatch[1] : 'Not found');
      console.log('Desc:', descMatch ? descMatch[1] : 'Not found');
    } catch(e) {
      console.log('Error fetching', u);
    }
  }
}
fetchMeta();
