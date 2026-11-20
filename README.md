# SOMAAMRIT | सोमामृत

Website for **Somaamrit**, a brand of single-origin, natural and lab-verified Himalayan wellness products from Palampur and Shimla, Himachal Pradesh.

## Products featured

- Himalayan Shilajit Resin
- Himalayan Raw Honey
- Alpine Wildflower Honey
- Cordyceps-Infused Honey and Cordyceps Honey Extract
- Cordyceps Mushroom
- Triphala Powder
- Organic Saffron
- Himalayan Haldi

## Highlights

- **Interactive comic book** that tells the Somaamrit story, with a full-screen landscape reader on phones (tap the comic, then tilt your phone).
- **Scroll animations** throughout the page.
- Sections for the product collection, the Shilajit story, origins, the journey from harvest to doorstep, lab results, comparison, testimonials, gifting and FAQ.
- Plain HTML, CSS and vanilla JavaScript, with no framework and no build step.

## Project structure

```
.
├── index.html            # the whole page
├── css/
│   └── styles.css
├── js/
│   ├── main.js           # general interactions
│   ├── motion.js         # scroll animations
│   ├── comic.js          # interactive comic book
│   └── immersive.js      # phone-only full-screen comic reader
└── assets/
    └── somaamrit-display.jpg
```

## Running locally

No install is needed. Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
```

Then visit <http://localhost:8000>.

The only external resource is Google Fonts, so an internet connection is needed for the fonts to load.

## Deploying

The site is fully static. To host it on GitHub Pages, go to **Settings → Pages**, choose the `main` branch and the root folder, and save.
