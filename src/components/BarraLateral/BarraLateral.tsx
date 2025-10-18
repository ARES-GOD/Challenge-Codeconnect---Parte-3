import { type FC } from "react";
import styled from "styled-components";
import ItemNavegacion from "./ItemNavegacion";
import { NavLink } from "react-router-dom";

const ListaEstilizada = styled.ul`
   margin: 0;
   padding: 0;
   list-style: none;
   width: 177px;
   gap:40px;
   display:flex;
   flex-direction: column;
   align-items:center;
`

interface IProps { };

const BarraLateral: FC<IProps> = () => {
    return (
        <aside className="w-[177px] bg-[#171D1F] px-4 py-0 sticky top-0 h-screen flex-shrink-0">
            <nav className="flex flex-col gap-[80px] items-center">
                <NavLink to={"/"} className="mt-10">
                    <img src="/src/assets/CodeConnect_Logo.png"
                    alt="Logo CodeConnect"
                    width={127}
                    height={40} />
                </NavLink>
                
                <ListaEstilizada>
                    <ItemNavegacion
                        iconoActivo="/iconos/publicar-activo.png"
                        iconoInactivo="/iconos/publicar-inactivo.png"
                        link="/share"
                    />
                    <ItemNavegacion
                        iconoActivo="/iconos/feed-activo.png"
                        iconoInactivo="/iconos/feed-inactivo.png"
                        link="/feed"
                    />
                    <ItemNavegacion
                        iconoActivo="/iconos/perfil-activo.png"
                        iconoInactivo="/iconos/perfil-inactivo.png"
                        link="/perfil"
                    />
                    <ItemNavegacion
                        iconoActivo="/iconos/sobreNosotros-activo.png"
                        iconoInactivo="/iconos/sobreNosotros-inactivo.png"
                        link="/sobreNosotros"
                    />
                    <ItemNavegacion
                        iconoActivo="/iconos/salir.png"
                        iconoInactivo="/iconos/salir.png"
                        link="/"
                    />
                </ListaEstilizada>
            </nav>
        </aside>
    )
};

export default BarraLateral;