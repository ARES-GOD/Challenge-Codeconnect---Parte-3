import React, { type FC } from "react";

interface IProps { };

const SobreNosotros: FC<IProps> = (props) => {
    return (
        <div className="w-[995px] h-[1667px] flex flex-col gap-[56px] items-center">
            <img src="/src/assets/sobreNosotros_1.png" alt="" />
            <div>
                {/* Títulos */}
                <h1 className="text-center font-extrabold text-3xl md:text-4xl lg:text-5xl text-[#81FE88]">
                    ¡Bienvenido a CodeConnect!
                </h1>

                <p className="mt-2 text-center text-xl md:text-2xl lg:text-3xl text-gray-100">
                    ¡Donde la comunidad y el código se unen!
                </p>
            </div>
            {/* Intro */}
            <p className="leading-relaxed text-gray-300">
                En el corazón de la revolución digital está la colaboración. CodeConnect
                nació con la visión de crear un espacio donde desarrolladores, programadores
                y entusiastas de la tecnología puedan conectarse, aprender y colaborar de
                una manera sin igual. Somos una comunidad global apasionada por el código y
                estamos comprometidos a ofrecer un entorno inclusivo e inspirador para todos
                los niveles de habilidad.
            </p>
            {/* Misión */}
            <section className="grid gap-[56px] md:grid-cols-2 md:items-start">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-100 mb-3">
                        Nuestra Misión
                    </h2>
                    <p className="leading-relaxed text-gray-300">
                        En CodeConnect, creemos que la colaboración es la esencia de la innovación.
                        Nuestra misión es ofrecer una plataforma donde las mentes creativas puedan
                        unirse, compartir conocimientos y desarrollar proyectos extraordinarios.
                        Ya seas un principiante con ganas de aprender o un veterano con experiencia,
                        aquí encontrarás un hogar para tus aspiraciones tecnológicas.
                    </p>
                </div>

                <div>
                    <img
                        src="/src/assets/sobreNosotros_2.png"
                        alt="Personas colaborando"
                        className="w-full rounded-lg shadow-md"
                    />
                </div>
            </section>
            {/* Sección Únete a Nosotros */}
            <div className="gap-[24px]">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-100 mb-3">
                    ¡Únete a Nosotros!
                </h2>

                <p className="text-gray-300 leading-relaxed mb-8">
                    Estamos emocionados de tenerte con nosotros en este emocionante viaje.
                    Únete a nuestra vibrante comunidad y descubre el poder de la colaboración
                    en el mundo del código.
                </p>
            </div>
            {/* Bloque destacado */}
            <div className="flex items-center gap-[32px]">
                <img
                    src="/src/assets/logo-green.png"
                    alt="Logo CodeConnect"
                />

                <p className="text-[#888888] text-xl md:text-2xl font-semibold leading-snug">
                    Juntos, vamos a transformar ideas en innovaciones y a
                    moldear el futuro digital.
                </p>
            </div>

        </div>
    )
};

export default SobreNosotros;