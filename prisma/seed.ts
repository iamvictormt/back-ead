import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  // Curso 1: React
  const reactCourse = await prisma.course.create({
    data: {
      id: 3,
      title: 'Introdução ao React',
      description: 'Aprenda os fundamentos do React, incluindo JSX, componentes e estado.',
      price: 99.9,
      thumbnailUrl: 'https://cdn.meuplataforma.com/cursos/react-intro.png',
      instructor: 'João Silva',
      category: 'Desenvolvimento Web',
      rating: 4.7,
      studentsCount: 120,
      modules: {
        create: [
          {
            title: 'Fundamentos do React',
            order: 1,
            lessons: {
              create: [
                {
                  title: 'O que é React?',
                  videoUrl: 'https://youtube.com/123',
                  pdfUrl: null,
                  order: 1,
                },
                {
                  title: 'Criando seu primeiro componente',
                  videoUrl: 'https://youtube.com/124',
                  pdfUrl: 'https://cdn.meuplataforma.com/materials/react-componente.pdf',
                  order: 2,
                },
              ],
            },
          },
          {
            title: 'Hooks básicos',
            order: 2,
            lessons: {
              create: [
                {
                  title: 'useState na prática',
                  videoUrl: 'https://youtube.com/125',
                  pdfUrl: null,
                  order: 1,
                },
                {
                  title: 'useEffect e ciclo de vida',
                  videoUrl: 'https://youtube.com/126',
                  pdfUrl: null,
                  order: 2,
                },
              ],
            },
          },
        ],
      },
    },
  });

  // Curso 2: Python Data Science
  const pythonCourse = await prisma.course.create({
    data: {
      id: 4,
      title: 'Python para Data Science',
      description: 'Domine Python com foco em ciência de dados, análise e machine learning.',
      price: 149.5,
      thumbnailUrl: 'https://cdn.meuplataforma.com/cursos/python-ds.png',
      instructor: 'Maria Souza',
      category: 'Data Science',
      rating: 4.9,
      studentsCount: 340,
      modules: {
        create: [
          {
            title: 'Introdução ao Python',
            order: 1,
            lessons: {
              create: [
                {
                  title: 'Variáveis e tipos de dados',
                  videoUrl: 'https://youtube.com/201',
                  pdfUrl: null,
                  order: 1,
                },
                {
                  title: 'Estruturas de controle',
                  videoUrl: 'https://youtube.com/202',
                  pdfUrl: null,
                  order: 2,
                },
              ],
            },
          },
          {
            title: 'Bibliotecas para Data Science',
            order: 2,
            lessons: {
              create: [
                {
                  title: 'Numpy e Pandas',
                  videoUrl: 'https://youtube.com/203',
                  pdfUrl: 'https://cdn.meuplataforma.com/materials/numpy-pandas.pdf',
                  order: 1,
                },
                {
                  title: 'Visualização com Matplotlib',
                  videoUrl: 'https://youtube.com/204',
                  pdfUrl: null,
                  order: 2,
                },
              ],
            },
          },
        ],
      },
    },
  });

  // Curso 3: Design com Figma
  const figmaCourse = await prisma.course.create({
    data: {
      id: 5,
      title: 'Design de Interfaces com Figma',
      description: 'Aprenda a criar interfaces modernas e intuitivas usando o Figma.',
      price: 79.0,
      thumbnailUrl: 'https://cdn.meuplataforma.com/cursos/figma-ui.png',
      instructor: 'Carla Mendes',
      category: 'Design',
      rating: 4.5,
      studentsCount: 89,
      modules: {
        create: [
          {
            title: 'Primeiros passos no Figma',
            order: 1,
            lessons: {
              create: [
                {
                  title: 'Conhecendo a interface',
                  videoUrl: 'https://youtube.com/301',
                  pdfUrl: null,
                  order: 1,
                },
                {
                  title: 'Ferramentas básicas',
                  videoUrl: 'https://youtube.com/302',
                  pdfUrl: null,
                  order: 2,
                },
              ],
            },
          },
          {
            title: 'Criando protótipos',
            order: 2,
            lessons: {
              create: [
                {
                  title: 'Wireframes',
                  videoUrl: 'https://youtube.com/303',
                  pdfUrl: null,
                  order: 1,
                },
                {
                  title: 'Protótipos interativos',
                  videoUrl: 'https://youtube.com/304',
                  pdfUrl: 'https://cdn.meuplataforma.com/materials/figma-prototipos.pdf',
                  order: 2,
                },
              ],
            },
          },
        ],
      },
    },
  });

  console.log('✅ Seed concluído com sucesso!');
  console.log({ reactCourse, pythonCourse, figmaCourse });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
