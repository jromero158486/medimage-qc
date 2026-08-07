# Contributing

Thank you for improving MedImage QC.

## Development

```bash
npm install
npm run dev
```

Before opening a pull request:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

## Algorithm changes

Quality metrics are easy to overstate. A contribution that changes an algorithm or normalized score should include:

1. A description of what the metric measures.
2. A description of important confounders.
3. At least one deterministic synthetic test.
4. Evidence that the score changes in the expected direction.
5. Cautious, non-diagnostic interface copy.

## Privacy

Do not add image uploads, logging of pixel data, or third-party analytics that inspect filenames or image-derived values without an explicit design discussion.

## Accessibility

Keep keyboard navigation, visible focus indicators, text labels in addition to color, and reduced-motion behavior intact.
