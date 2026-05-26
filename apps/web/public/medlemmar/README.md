# Member photos

Drop member headshot files here, named by slug:

```
carina-widell-turpini.jpg
eva-eriksson.jpg
```

Recommended:
- Square (1:1), at least 600×600 px
- JPG or WEBP, < 200 KB after compression
- Looking-at-camera or 3/4 angle works well; full-body shots get awkwardly cropped

The components check for the file at `/medlemmar/<slug>.jpg`. If the file is
missing the gradient placeholder is rendered instead — no broken-image icons.

For the founder cards on `/` and `/om`, the slug is
`carina-widell-turpini` — drop `carina-widell-turpini.jpg` and both pages pick
it up automatically.
