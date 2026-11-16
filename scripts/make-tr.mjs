// Generates tr/index.html from index.html. Edit the English page, then run `npm run build` (or `node scripts/make-tr.mjs`).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

let s = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const missing = [];
const R = (a, b) => { if (!s.includes(a)) missing.push(a); s = s.split(a).join(b); };

// head
R('<html lang="en">', '<html lang="tr">');
R('<title>Tanrikulu.dev — Mobile App, Web &amp; Brand Design Studio</title>', '<title>Tanrikulu.dev — Mobil Uygulama, Web Tasarım ve Marka Stüdyosu</title>');
R('content="Independent studio designing and building iOS &amp; Android apps, fast Next.js websites and brand identities, from the first call to launch and beyond."', 'content="iOS ve Android mobil uygulama geliştirme, hızlı ve SEO uyumlu web sitesi tasarımı ve kurumsal kimlik tasarımı. İlk görüşmeden yayına kadar bağımsız stüdyo."');
R('<link rel="canonical" href="https://tanrikulu.dev/" />', '<link rel="canonical" href="https://tanrikulu.dev/tr" />');
R('<meta property="og:url" content="https://tanrikulu.dev/" />', '<meta property="og:url" content="https://tanrikulu.dev/tr" />');
R('<meta property="og:locale" content="en_US" />\n  <meta property="og:locale:alternate" content="tr_TR" />', '<meta property="og:locale" content="tr_TR" />\n  <meta property="og:locale:alternate" content="en_US" />');
R('content="Tanrikulu.dev — We make software you can feel."', 'content="Tanrikulu.dev — Hissedilen yazılımlar ve markalar."');
R('content="Independent studio for mobile apps, websites and brand identities."', 'content="Mobil uygulamalar, web siteleri ve marka kimlikleri için bağımsız stüdyo."');
R('content="https://tanrikulu.dev/og.png"', 'content="https://tanrikulu.dev/og-tr.png"');
R('"description": "Independent studio designing and building mobile apps, websites and brand identities."', '"description": "Mobil uygulamalar, web siteleri ve marka kimlikleri tasarlayıp geliştiren bağımsız stüdyo."');
R('{ "@type": "Service", "name": "Mobile app development", "description": "iOS and Android apps with React Native, Flutter and Swift." }', '{ "@type": "Service", "name": "Mobil uygulama geliştirme", "description": "React Native, Flutter ve Swift ile iOS ve Android uygulamaları." }');
R('{ "@type": "Service", "name": "Website and web app development", "description": "Fast, search-friendly Next.js websites and web apps." }', '{ "@type": "Service", "name": "Web sitesi ve web uygulaması geliştirme", "description": "Hızlı ve SEO uyumlu Next.js web siteleri ve web uygulamaları." }');
R('{ "@type": "Service", "name": "Brand identity design", "description": "Logos, typography, colour and design systems." }', '{ "@type": "Service", "name": "Kurumsal kimlik ve marka tasarımı", "description": "Logo, tipografi, renk ve tasarım sistemleri." }');
R('"name": "Services",', '"name": "Hizmetler",');
R('<h1 class="sr-only">Tanrikulu.dev — an independent studio for mobile apps, websites and brand identity. We make software you can feel.</h1>', '<h1 class="sr-only">Tanrikulu.dev — mobil uygulamalar, web siteleri ve marka kimliği için bağımsız bir stüdyo. Hissedilen yazılımlar ve markalar.</h1>');
R('tanrikulu.dev — mobile, web &amp; brand studio.<br />Write to hello@tanrikulu.dev', 'tanrikulu.dev — mobil, web ve marka stüdyosu.<br />Bize yazın: hello@tanrikulu.dev');
R('aria-label="tanrikulu.dev studio board"', 'aria-label="tanrikulu.dev stüdyo panosu"');

// hero
R('◇ 01 · tanrikulu.dev / home', '◇ 01 · tanrikulu.dev / ana sayfa');
R('<span>mobile · web · brand</span>', '<span>mobil · web · marka</span>');
R('<span>booking Q1 2027</span>', '<span>2027 Q1 için açık</span>');
R('id="w1">We make<', 'id="w1">Hissedilen<');
R('id="w2">software you<', 'id="w2">yazılımlar<');
R('id="w3">can<', 'id="w3">ve<');
R('id="w4">feel.<', 'id="w4">markalar.<');
R('>Start a project →<', '>Proje başlat →<');
R('aria-label="Available for projects, booking Q1 2027"', 'aria-label="Yeni projelere açığız, 2027 ilk çeyrek"');
R('</i>studio status</span><span>live</span>', '</i>stüdyo durumu</span><span>canlı</span>');
R('<em>✓ resolved</em>', '<em>✓ çözüldü</em>');
R('<b>Approved ✓</b><small>by Aden · client</small>', '<b>Onaylandı ✓</b><small>Aden · müşteri</small>');
R('<span>art direction</span>', '<span>sanat yönetmeni</span>');
R('<span>Aden · client</span>', '<span>Aden · müşteri</span>');

R('<span style="background:#FF3D7F">design</span>', '<span style="background:#FF3D7F">tasarım</span>');

// services
R('◇ 02 · services', '◇ 02 · hizmetler');
R('<span class="plab">components</span>', '<span class="plab">bileşenler</span>');
R('<span class="chip c1">Card</span><span class="chip c2 drag">Pay →</span><span class="chip c3">Tabs</span>', '<span class="chip c1">Kart</span><span class="chip c2 drag">Öde →</span><span class="chip c3">Sekme</span>');
R('<span style="background:#141414">design</span>', '<span style="background:#141414">tasarım</span>');
R('<span style="background:#141414">brand</span>', '<span style="background:#141414">marka</span>');
R('<h3>Mobile<br />apps</h3>', '<h3>Mobil<br />uygulamalar</h3>');
R('<p>iOS &amp; Android. React Native, Flutter, Swift. Fast cold starts, smooth everything.</p>', '<p>iOS ve Android. React Native, Flutter, Swift. Hızlı açılır, her şey akıcı.</p>');
R('<h3>Web<br />products</h3>', '<h3>Web<br />ürünleri</h3>');
R('<p>Next.js sites and web apps that score 100 and convert.</p>', '<p>100 puan alan ve satışa dönüşen Next.js siteleri ve web uygulamaları.</p>');
R('<h3>Brand<br />identity</h3>', '<h3>Marka<br />kimliği</h3>');
R('<p>Logos, type, colour and systems that scale.</p>', '<p>Büyüdükçe dağılmayan logo, tipografi, renk ve sistemler.</p>');

// app
R('◇ 03 · app / home', '◇ 03 · uygulama / ana sayfa');
R('<small>Good morning</small><h4>Hey Aden,</h4>', '<small>Günaydın</small><h4>Selam Aden,</h4>');
R('<small>Revenue · this week</small>', '<small>Gelir · bu hafta</small>');
R('</i>Send</span>', '</i>Gönder</span>'); R('</i>Invoice</span>', '</i>Fatura</span>'); R('</i>Scan</span>', '</i>Tara</span>'); R('</i>More</span>', '</i>Diğer</span>');
R('<b>Recent orders</b><small>See all</small>', '<b>Son siparişler</b><small>Tümü</small>');
R('<small>2 min ago</small>', '<small>2 dk önce</small>'); R('<small>14 min ago</small>', '<small>14 dk önce</small>');
R('<small>1 h ago</small>', '<small>1 sa önce</small>'); R('<small>3 h ago</small>', '<small>3 sa önce</small>');
R('<small>Yesterday</small>', '<small>Dün</small>'); R('<small>just now</small>', '<small>az önce</small>');
R('a-st ok">Paid<', 'a-st ok">Ödendi<'); R('a-st sh">Shipped<', 'a-st sh">Kargoda<'); R('a-st pe">Pending<', 'a-st pe">Bekliyor<'); R('a-st nw">New<', 'a-st nw">Yeni<');
R('<small>1,284 this month</small><h4>Orders</h4>', '<small>bu ay 1.284</small><h4>Siparişler</h4>');
R('<span>All</span><span>Pending</span><span>Done</span>', '<span>Tümü</span><span>Bekleyen</span><span>Biten</span>');
R('<b>New order #1285</b>', '<b>Yeni sipariş #1285</b>');
R('<small>Last 7 days</small><h4>Analytics</h4>', '<small>Son 7 gün</small><h4>Analiz</h4>');
R('<small>Visitors</small>', '<small>Ziyaretçi</small>'); R('<small>Avg. order</small>', '<small>Ort. sipariş</small>'); R('<small>Returning</small>', '<small>Geri dönen</small>');
['M', 'T', 'W', 'T', 'F', 'S', 'S'].forEach((d, i) => { const tr = ['P', 'S', 'Ç', 'P', 'C', 'C', 'P'][i]; s = s.replace(`<em>${d}</em></span>`, `<em>@@${tr}</em></span>`); });
s = s.split('<em>@@').join('<em>');
R('<small>Online</small>', '<small>Çevrimiçi</small>');
R('Hi! Is the blue one back in stock? 💙', 'Merhaba! Mavisi yeniden stokta mı? 💙');
R('Yes — restocked this morning.', 'Evet, bu sabah geldi.');
R('Want me to hold one for you?', 'Size bir tane ayırayım mı?');
R('Please! Ordering now 🙌', 'Lütfen! Hemen sipariş veriyorum 🙌');
R('<span>Home</span></button>', '<span>Ana</span></button>'); R('<span>Orders</span></button>', '<span>Sipariş</span></button>');
R('<span>Stats</span></button>', '<span>Analiz</span></button>'); R('<span>Chat</span><em class="a-badge">', '<span>Sohbet</span><em class="a-badge">');
R("← real app we'd ship", '← yayınlayacağımız gerçek bir uygulama');

// brand
R('◇ 04 · brand explorations', '◇ 04 · marka denemeleri');
R('>monogram · construction<', '>monogram · yapım ızgarası<'); R('>app icon · 6 directions<', '>uygulama ikonu · 6 yön<'); R('>01 · gradient<', '>01 · gradyan<'); R('>02 · glass<', '>02 · cam<'); R('>03 · cursor<', '>03 · imleç<'); R('>04 · sticker<', '>04 · çıkartma<'); R('>05 · pixel<', '>05 · piksel<'); R('>06 · vector<', '>06 · vektör<');
R('>mark · liquid<', '>amblem · akışkan<');
R('>monogram · extrude<', '>monogram · derinlik<');
R('>monogram · slice<', '>monogram · dilim<');
R('>wordmark · kerning<', '>yazı logo · harf aralığı<');
R('>Caveat · sketch<', '>Caveat · eskiz<');
R('>wordmark · sketch → set<', '>yazı logo · eskizden fonta<');
R('>wordmark · on a path<', '>yazı logo · yol üstünde<');
R('>app icon · in context<', '>uygulama ikonu · ana ekranda<');
R('<span>light</span><span>dark</span><span>tinted</span>', '<span>açık</span><span>koyu</span><span>renkli</span>');
R('>app icon · iOS modes<', '>uygulama ikonu · iOS modları<');
R('>type · elastic<', '>tipografi · esnek<');
R('<small>we design</small>', '<small>tasarlıyoruz</small>');
R('>apps</span><span style="--i:1">websites</span><span style="--i:2">brands</span><span style="--i:3">motion<', '>uygulama</span><span style="--i:1">web sitesi</span><span style="--i:2">marka</span><span style="--i:3">hareket<');
R('>type · barrel<', '>tipografi · silindir<');
R('>type · liquid fill<', '>tipografi · sıvı dolgu<');
R('>pixel · stack<', '>piksel · istif<');
R('>pixel · halftone<', '>piksel · raster<');
R('>pixel · mascot<', '>piksel · maskot<');
R('TANRIKULU.DEV · MOBILE · WEB · BRAND ·', 'TANRIKULU.DEV · MOBİL · WEB · MARKA ·');
R('>mark · seal<', '>amblem · mühür<');
R('>mark · pattern<', '>amblem · desen<'); 


// process
R('>how a project runs ↓<', '>bir proje nasıl ilerler ↓<');
for (const n of ['01', '02', '03', '04']) R(`<small>step ${n}</small>`, `<small>adım ${n}</small>`);
R('Discover. One call, a plan &amp; a fixed quote.', 'Keşif. Tek görüşme, bir plan ve net bir fiyat.');
R('Design real screens, not decks.', 'Sunum değil, gerçek ekranlar tasarlarız.');
R('Build with a preview link for every change.', 'Her değişikliği önizleme linkiyle geliştiririz.');
R('Launch &amp; stick around.', 'Yayına alırız ve yanınızda kalırız.');

// contact
R('◇ 07 · contact', '◇ 07 · iletişim');
R('◇ 05 · vibe check', '◇ 05 · vibe testi'); R("try it, it's live ↓", 'dene, canlı ↓');
R('<h2>Leave a note on the board.</h2>', '<h2>Panoya bir not bırak.</h2>');
R('placeholder="Your name" aria-label="Your name"', 'placeholder="Adın" aria-label="Adın"');
R('placeholder="Email" aria-label="Email"', 'placeholder="E-posta" aria-label="E-posta"');
R('placeholder="What are we building?" aria-label="Project details"', 'placeholder="Ne yapıyoruz? Projeni anlat." aria-label="Proje detayları"');
R('>Pin it →<', '>Panoya iliştir →<');
R('>or write to <b>', '>ya da yaz: <b>');

// chrome
R('aria-label="tanrikulu.dev home"', 'aria-label="tanrikulu.dev ana sayfa"');
R('studio board · autosaved just now', 'stüdyo panosu · az önce kaydedildi');
R('<a href="/" hreflang="en" class="on">EN</a><a href="/tr" hreflang="tr" lang="tr">TR</a>', '<a href="/" hreflang="en" lang="en">EN</a><a href="/tr" hreflang="tr" class="on" aria-current="page">TR</a>');
R('>Hire us</button>', '>Teklif al</button>');
R('data-key="home" class="on">Home<', 'data-key="home" class="on">Giriş<'); R('data-key="services">Services<', 'data-key="services">Hizmetler<');
R('data-key="app">App<', 'data-key="app">Uygulama<'); R('data-key="brand">Brand<', 'data-key="brand">Marka<');
R('data-key="process">Process<', 'data-key="process">Süreç<'); R('data-key="contact">Contact<', 'data-key="contact">İletişim<');
R('>⤢ Overview<', '>⤢ Genel bakış<');
R('scroll to walk the board ↓ · drag to look around', 'panoyu gezmek için kaydır ↓ · etrafa bakmak için sürükle');

if (missing.length) { console.error('make-tr: not found in index.html:\n  ' + missing.join('\n  ')); process.exit(1); }
mkdirSync(new URL('../tr/', import.meta.url), { recursive: true });
writeFileSync(new URL('../tr/index.html', import.meta.url), '<!-- generated by scripts/make-tr.mjs from index.html — do not edit by hand -->\n' + s);
console.log('make-tr: tr/index.html written');
