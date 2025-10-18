import { type FC } from "react";
import type { IProject } from "../interface/IProject";
import { Link } from "react-router-dom";

interface IProps {
  project: IProject;
}

const ProjectCard: FC<IProps> = ({ project }) => {
  const authorName  = project.autorData?.user ?? project.autorId;
  const authorImage = project.autorData?.image;

  return (
    <div className="bg-[#2A2F36] rounded-lg overflow-hidden hover:bg-[#343A42] transition-colors">
      <Link to={`/project/${project.id}`}>
        {/* Imagen del proyecto */}
        <div className="relative aspect-video w-full">
          <img
            src={project.image}
            alt={project.titulo}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
        </div>

        {/* Contenido */}
        <div className="p-4">
          {/* Título */}
          <h2 className="text-white text-lg font-semibold mb-2 line-clamp-2">
            {project.titulo}
          </h2>

          {/* Descripción */}
          <p className="text-gray-400 text-sm mb-4 line-clamp-3">
            {project.descripcion}
          </p>

          {/* Fila inferior: autor + métricas a la IZQUIERDA */}
          <div className="flex items-center justify-between gap-4 text-gray-400">

            {/* Métricas */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{project.metrics.code}</span>
              </div>

              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{project.metrics.comments}</span>
              </div>

              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                </svg>
                <span>{project.metrics.share}</span>
              </div>
            </div>

            {/* Autor */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center">
                {authorImage ? (
                  <img
                    src={authorImage}
                    alt={authorName}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
              <span className="text-white text-sm font-medium">@{authorName}</span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default ProjectCard;
