import type { Metadata } from 'next';

export const metadata: Metadata = {
     title: 'WatchList',
     description: 'Track the movies and shows you watch',
}

export default function RootLayout({
     children,
}: {
     children: React.ReactNode
}) {
     return (
          <html lang="en">
               <head>
                    <meta name="theme-color" content="#317EFB" />

                    <link rel="manifest" href="/manifest.json" crossOrigin="use-credentials"></link>

                    <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.3.1/css/all.css" integrity="sha384-mzrmE5qonljUremFsqc01SB46JvROS7bZs3IO2EmfFsd15uHvIt+Y8vEf7N7fWAU" crossOrigin="anonymous"></link>
               </head>
               <body>{children}</body>
          </html>
     )
}