import Image from 'next/image'

type CategoryHeroProps = {
  eyebrow: string
  title: string
  description: string
  image: string
}

export function CategoryHero({ eyebrow, title, description, image }: CategoryHeroProps) {
  return (
    <section className="relative isolate flex min-h-[320px] items-end overflow-hidden bg-slate-950 px-4 pb-12 pt-32 sm:px-6 lg:px-8">
      <Image
        src={image}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-slate-950/45" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-background" />

      <div className="relative z-10 mx-auto w-full max-w-7xl text-white">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-white/80">
          {eyebrow}
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight tracking-tight drop-shadow-sm sm:text-5xl">
          {title}
        </h1>
        <p className="mt-4 max-w-2xl text-sm font-semibold leading-6 text-white/85 sm:text-base">
          {description}
        </p>
      </div>
    </section>
  )
}
