# Third-party notices and attribution

WORKOUT//INDEX is a small, independent application derived from an AGPL-licensed source project.
This file records the licences and attributions that legally must travel with the derived work
(text, fonts) and the rights situation of the media that does **not** travel with it.

## WORKOUT//INDEX is a modified work

WORKOUT//INDEX is a derivative work. It was built by extracting the exercise-library slice
(exercise catalogue, muscle overlay, search behaviour and the complete Russian instruction pack)
from **Cyber Gym**, which is itself a derivative of **openGym** — Copyright (C) 2026 Duarte
Santos (<https://github.com/DuarteSantos8/openGym>).

Cyber Gym was licensed under the GNU Affero General Public License v3.0; WORKOUT//INDEX is a
modified work of it and is therefore distributed under the same licence,
**AGPL-3.0-or-later** (see [LICENSE](LICENSE)).

The names and links in this paragraph appear only because attribution is a licence condition.
They are the minimum legal attribution and source reference; they are not part of the product,
its interface, its metadata or its marketing copy.

Corresponding source for this modified work:
<https://github.com/Kurubik/workout>

## Exercise data & instruction text

Exercise metadata and the English instruction text reach this project through
[**hasaneyldrm/exercises-dataset**](https://github.com/hasaneyldrm/exercises-dataset), which
licenses them differently from the application code. That dataset is itself a redistribution:
the content originates from [**ExerciseDB v1**](https://exercisedb.dev/) by **AscendAPI**.

The exercise names, attributes and instructions are distributed under the MIT licence
reproduced below. The **Russian** instruction translations are derivative works and remain
under the AGPL, as do the Russian interface strings.

```
MIT License

Copyright (c) 2026 Hasan Emir Yıldırım

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation and data files (the "Software"),
to deal in the Software without restriction, including without limitation the
rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
sell copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Images & animations — third-party, not MIT and not AGPL

The exercise thumbnails and animations are **not** covered by the MIT licence above and **not**
by this project's AGPL. Their ownership is unresolved upstream, and this notice says so plainly
rather than guessing:

- The dataset attributes them to **© [Gym visual](https://gymvisual.com/)**, redistributed there
  with that rights holder's written permission — a permission granted to *that dataset* and
  **not transferable**.
- **ExerciseDB/AscendAPI** describes itself as the original creator and owner of this content
  and publishes its own [terms](https://exercisedb.io/faq), which permit self-hosting, bundling
  and commercial display while prohibiting redistribution of the raw dataset or media as a
  standalone or competing content package.

These two claims contradict each other upstream. **Until that is settled, treat the media as
third-party content licensed to neither this project nor to you.**

**WORKOUT//INDEX does not redistribute the media.** It is not in this repository, not in its
Git history, not in its container image and not in its service-worker cache. The application
loads it at runtime from a pinned upstream CDN commit:

- images: `https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@7455efae41b330c265e7cd4b78dfa848e7ce5ebd/images/`
- animations: `https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@7455efae41b330c265e7cd4b78dfa848e7ce5ebd/videos/`

If you want to reuse the media, commercially or not, **clear it with the rights holder first**
and keep any attribution that accompanies it intact. If the CDN is unavailable or blocked, the
application shows a plain fallback and the instruction text — it never shows a broken image.

## Fonts

The interface ships two self-hosted font families as Cyrillic and Latin WOFF2 subsets, each
under the **SIL Open Font License 1.1**:

- **IBM Plex Sans** — Copyright © 2017 IBM Corp., with Reserved Font Name "Plex".
  Full licence text: [`public/fonts/OFL-ibmplexsans.txt`](public/fonts/OFL-ibmplexsans.txt)
- **JetBrains Mono** — Copyright 2020 The JetBrains Mono Project Authors
  (<https://github.com/JetBrains/JetBrainsMono>).
  Full licence text: [`public/fonts/OFL-jetbrainsmono.txt`](public/fonts/OFL-jetbrainsmono.txt)

Both families are used unmodified, are not sold on their own, and keep their reserved names.

## Application code

Everything else in this repository — the application shell, the catalogue composition, the
search, the interface, the deployment files and the tests — is part of the modified work and is
licensed **AGPL-3.0-or-later**.
