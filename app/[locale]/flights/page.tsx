import { FlightsSearch } from './flights-search'

export const dynamic = 'force-dynamic'

export default function FlightsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Flights</h1>
      <p className="text-gray-600 mb-6">
        Real-time flight search powered by Duffel.
      </p>
      <FlightsSearch />
    </div>
  )
}
