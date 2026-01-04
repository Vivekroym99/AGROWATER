import Link from 'next/link';
import {
  Satellite,
  Bell,
  BarChart3,
  Smartphone,
  MapPin,
  Droplets,
  CheckCircle,
  ArrowRight,
  Leaf
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-gray-100 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <Droplets className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">AgroWater</span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Zaloguj sie
              </Link>
              <Link
                href="/register"
                className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                Zaloz konto
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Satellite className="h-4 w-4" />
              Dane z satelity Sentinel-1
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              Monitoruj wilgotnosc gleby
              <span className="text-green-600"> z satelity</span>
            </h1>
            <p className="mt-6 text-xl text-gray-600 max-w-2xl mx-auto">
              Bez czujnikow. Bez instalacji. Za darmo.
              Otrzymuj dane o wilgotnosci swoich pol co kilka dni
              i alerty gdy gleba staje sie zbyt sucha.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="w-full sm:w-auto bg-green-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                Zaloz konto za darmo
                <ArrowRight className="h-5 w-5" />
              </Link>
              <a
                href="#jak-to-dziala"
                className="w-full sm:w-auto text-gray-700 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
              >
                Jak to dziala?
              </a>
            </div>
          </div>

          {/* Hero Image/Mockup */}
          <div className="mt-16 relative">
            <div className="bg-gradient-to-b from-green-50 to-white rounded-3xl p-4 sm:p-8 shadow-2xl shadow-green-500/10">
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                {/* Mock Dashboard */}
                <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <div className="p-6 space-y-4">
                  {/* Stats Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-blue-50 rounded-xl p-4">
                      <p className="text-2xl font-bold text-gray-900">12</p>
                      <p className="text-sm text-gray-600">Pol</p>
                    </div>
                    <div className="bg-green-50 rounded-xl p-4">
                      <p className="text-2xl font-bold text-gray-900">156 ha</p>
                      <p className="text-sm text-gray-600">Powierzchnia</p>
                    </div>
                    <div className="bg-green-50 rounded-xl p-4">
                      <p className="text-2xl font-bold text-gray-900">10</p>
                      <p className="text-sm text-gray-600">W normie</p>
                    </div>
                    <div className="bg-yellow-50 rounded-xl p-4">
                      <p className="text-2xl font-bold text-gray-900">2</p>
                      <p className="text-sm text-gray-600">Wymaga uwagi</p>
                    </div>
                  </div>
                  {/* Chart Placeholder */}
                  <div className="bg-gray-50 rounded-xl p-6 h-48 flex items-end justify-around">
                    <div className="w-8 bg-green-400 rounded-t" style={{ height: '60%' }}></div>
                    <div className="w-8 bg-green-400 rounded-t" style={{ height: '75%' }}></div>
                    <div className="w-8 bg-green-400 rounded-t" style={{ height: '45%' }}></div>
                    <div className="w-8 bg-yellow-400 rounded-t" style={{ height: '30%' }}></div>
                    <div className="w-8 bg-green-400 rounded-t" style={{ height: '55%' }}></div>
                    <div className="w-8 bg-green-400 rounded-t" style={{ height: '70%' }}></div>
                    <div className="w-8 bg-green-400 rounded-t" style={{ height: '80%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Wszystko czego potrzebujesz
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              Profesjonalne monitorowanie wilgotnosci bez kosztow sprzetu
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                <Satellite className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Dane z satelity
              </h3>
              <p className="text-gray-600">
                Wykorzystujemy darmowe dane z europejskiego satelity Sentinel-1 ESA.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Aktualizacja co kilka dni
              </h3>
              <p className="text-gray-600">
                Nowe odczyty wilgotnosci pojawiaja sie automatycznie co 3-6 dni.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mb-4">
                <Bell className="h-6 w-6 text-yellow-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Alerty email
              </h3>
              <p className="text-gray-600">
                Otrzymujesz powiadomienie gdy wilgotnosc spada ponizej progu.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                <Smartphone className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Telefon i komputer
              </h3>
              <p className="text-gray-600">
                Aplikacja dziala na kazdym urzadzeniu z przegladarka internetowa.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="jak-to-dziala" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Jak to dziala?
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              Trzy proste kroki do monitorowania wilgotnosci
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <MapPin className="h-8 w-8 text-green-600" />
              </div>
              <div className="text-sm font-semibold text-green-600 mb-2">Krok 1</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Narysuj pole na mapie
              </h3>
              <p className="text-gray-600">
                Zaznacz granice swojego pola na interaktywnej mapie.
                Mozesz dodac wiele pol.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Satellite className="h-8 w-8 text-blue-600" />
              </div>
              <div className="text-sm font-semibold text-blue-600 mb-2">Krok 2</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Otrzymuj dane satelitarne
              </h3>
              <p className="text-gray-600">
                System automatycznie pobiera najnowsze dane z satelity
                i oblicza wskaznik wilgotnosci.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Bell className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="text-sm font-semibold text-yellow-600 mb-2">Krok 3</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Dostaj alerty o suszy
              </h3>
              <p className="text-gray-600">
                Gdy wilgotnosc spadnie ponizej ustawionego progu,
                otrzymasz powiadomienie email.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-green-600">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                Dlaczego warto monitorowac wilgotnosc?
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-200 flex-shrink-0 mt-0.5" />
                  <p className="text-green-50">
                    <span className="font-semibold text-white">Oszczedzaj wode</span> - nawadniaj tylko wtedy, gdy jest to naprawde potrzebne
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-200 flex-shrink-0 mt-0.5" />
                  <p className="text-green-50">
                    <span className="font-semibold text-white">Zwieksz plony</span> - rosliny otrzymuja optymalna ilosc wody
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-200 flex-shrink-0 mt-0.5" />
                  <p className="text-green-50">
                    <span className="font-semibold text-white">Reaguj szybciej</span> - dowiedz sie o problemach zanim beda widoczne
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-200 flex-shrink-0 mt-0.5" />
                  <p className="text-green-50">
                    <span className="font-semibold text-white">Zero kosztow sprzetu</span> - nie potrzebujesz czujnikow ani instalacji
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-2xl p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                  <Leaf className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-white font-semibold">AgroWater</p>
                  <p className="text-green-200 text-sm">Satelitarny monitoring wilgotnosci</p>
                </div>
              </div>
              <blockquote className="text-white text-lg italic">
                &ldquo;Dzieki AgroWater moge lepiej planowac nawadnianie i oszczedzam
                czas na objetdach pol. System sam informuje mnie gdy trzeba dzialac.&rdquo;
              </blockquote>
              <p className="text-green-200 mt-4">- Przykladowy rolnik</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
            Zacznij monitorowac swoje pola
          </h2>
          <p className="text-xl text-gray-600 mb-10">
            Zaloz darmowe konto w mniej niz minute i dodaj swoje pierwsze pole.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-green-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-green-700 transition-colors"
          >
            Zaloz konto za darmo
            <ArrowRight className="h-5 w-5" />
          </Link>
          <p className="mt-4 text-sm text-gray-500">
            Bez karty kredytowej. Bez zobowiazan.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <Droplets className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">AgroWater</span>
            </div>
            <div className="flex items-center gap-6 text-gray-400 text-sm">
              <Link href="/login" className="hover:text-white">
                Logowanie
              </Link>
              <Link href="/register" className="hover:text-white">
                Rejestracja
              </Link>
            </div>
            <p className="text-gray-500 text-sm">
              &copy; {new Date().getFullYear()} AgroWater. Dane satelitarne: ESA Sentinel-1.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
