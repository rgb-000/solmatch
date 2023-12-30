import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
       <meta property="og:type" content="website" />
        <meta property="og:title" />
        <meta
          property="og:description"
          content="Website is based on MarkSackerbers work"
        />
        <meta name="description" content="Website is based on MarkSackerbers work" />

        <meta
          property="og:image"
        />
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>suns cNFT machine</title>
        <link rel="icon" href="/favicon.ico" />
      <Head />
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
