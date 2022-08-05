import '../styles/globals.css'
import Link from 'next/link'

function MyApp({ Component, pageProps }) {
  return (
    <div>
      <nav className="border-b p-4 bg-[#2874f0] text-gray-50 ">
        {/* <p className='text-4xl font-bold float-right'>Become a seller</p> */}
        <div className='flex justify-between'>
        <p className='text-4xl font-bold text-2xl ml-6'>Flipkart</p>
        <div>
          <Link href="/">
            <a className='font-bold mt-4 text-white p-4 '>
              Home
            </a>
          </Link>
          <Link href="/create-item">
            <a className='font-bold mt-4 text-white p-4'>
              Sell Items
            </a>
          </Link>
          <Link href="/my-assets">
            <a className='font-bold mt-4 text-white p-4'>
              My Orders
            </a>
          </Link>
          <Link href="/creator-dashboard">
           <a className='font-bold mt-4 text-white p-4'>
              Orders sold
          </a>
          </Link>
          </div>
        </div>
      </nav>
      <Component {...pageProps} />
    </div>
  )
}

export default MyApp
