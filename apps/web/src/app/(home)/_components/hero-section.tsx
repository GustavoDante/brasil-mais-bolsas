import Image from "next/image";
import Link from "next/link";
import { ArrowRightCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SecondaryIcon } from "@/assets/secondary-icon";

export function HeroSection() {
  return (
    <section className="w-full bg-white">
      <div className="mx-auto w-full max-w-447 px-4 pt-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl shadow-lg">
          <div className="relative h-80 md:h-151.25">
            <Image
              src="/hero.png"
              alt="Estudantes felizes"
              fill
              priority
              sizes="100vw"
              className="object-cover object-center"
            />
            <div className="absolute inset-0 mx-auto w-full max-w-359 px-4">
              <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 rounded-3xl bg-black/40 p-5 backdrop-blur-md shadow-2xl border border-white/10 text-left sm:inset-x-auto sm:right-4 sm:w-85 sm:p-6 md:top-1/3">
                <div className="flex items-start justify-between">
                  {/* Único H1 da home — é a promessa principal da página. */}
                  <h1 className="space-y-1">
                    <span className="block text-[11px] font-bold tracking-wider text-white/90">
                      ESTUDE COM<br />BOLSAS DE ATÉ:
                    </span>
                    <span className="mt-2 block text-3xl font-black leading-tight text-white drop-shadow-md sm:text-4xl">
                      70% DE<br />DESCONTO
                    </span>
                  </h1>
                  <SecondaryIcon variant="colorfull" width={72} height={22} textColor="#EEEEEE" />
                </div>

                <Button
                  asChild
                  className="mt-6 w-full h-11 bg-white hover:bg-neutral-100 text-brand-blue-700 font-bold rounded-xl shadow-lg flex items-center justify-start px-4"
                >
                  <Link href="/bolsas">
                    <ArrowRightCircle className="mr-2 h-5 w-5" />
                    Garanta sua bolsa
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
