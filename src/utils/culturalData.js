/**
 * Cultural Data for Day of the Dead Traditions
 * Includes Coco movie themes and authentic cultural information
 */

export const culturalData = {
  altarLevels: {
    1: {
      es: {
        name: "Nivel Terrenal",
        description: "El primer nivel representa la tierra donde vivimos. Aquí se colocan elementos básicos para el viaje de las almas: agua para calmar la sed, sal para purificar y preservar el cuerpo espiritual, y pan para alimentar el alma.",
        meaning: "Este nivel simboliza nuestro mundo físico y la conexión con la vida cotidiana. Es donde comenzamos a honrar a nuestros difuntos con los elementos más esenciales para la supervivencia.",
        cocoConnection: {
          description: "En la película Coco, Miguel aprende que la familia es nuestra raíz y fundamento, así como este nivel es la base del altar. La tierra representa nuestras tradiciones familiares que nos mantienen conectados.",
          quote: "La familia es lo más importante",
          scene: "Cuando Miguel descubre la importancia de sus raíces familiares y comprende que las tradiciones nos conectan con nuestros antepasados."
        },
        traditionalOfferings: [
          {
            type: "agua",
            name: "Agua",
            icon: "💧",
            purpose: "Para calmar la sed del largo viaje desde el más allá"
          },
          {
            type: "sal",
            name: "Sal",
            icon: "🧂",
            purpose: "Para purificar y preservar el cuerpo espiritual"
          },
          {
            type: "pan_de_muerto",
            name: "Pan de Muerto",
            icon: "🍞",
            purpose: "Alimento sagrado que representa el ciclo de la vida y la muerte"
          }
        ],
        familyImportance: {
          description: "El nivel terrenal nos recuerda que nuestras raíces familiares son la base de nuestra identidad, tal como enseña Coco.",
          values: [
            "Respeto por nuestros antepasados",
            "Preservación de tradiciones familiares",
            "Conexión con nuestras raíces culturales",
            "Importancia de la memoria familiar"
          ]
        },
        audioExplanation: "/assets/audio/level1_explanation_es.mp3"
      },
      en: {
        name: "Earthly Level",
        description: "The first level represents the earth where we live. Here we place basic elements for the souls' journey: water to quench thirst, salt to purify and preserve the spiritual body, and bread to nourish the soul.",
        meaning: "This level symbolizes our physical world and connection to daily life. It's where we begin to honor our deceased with the most essential elements for survival.",
        cocoConnection: {
          description: "In the movie Coco, Miguel learns that family is our root and foundation, just as this level is the foundation of the altar. The earth represents our family traditions that keep us connected.",
          quote: "Family is everything",
          scene: "When Miguel discovers the importance of his family roots and understands that traditions connect us with our ancestors."
        },
        traditionalOfferings: [
          {
            type: "agua",
            name: "Water",
            icon: "💧",
            purpose: "To quench the thirst from the long journey from the beyond"
          },
          {
            type: "sal",
            name: "Salt",
            icon: "🧂",
            purpose: "To purify and preserve the spiritual body"
          },
          {
            type: "pan_de_muerto",
            name: "Bread of the Dead",
            icon: "🍞",
            purpose: "Sacred food representing the cycle of life and death"
          }
        ],
        familyImportance: {
          description: "The earthly level reminds us that our family roots are the foundation of our identity, just as Coco teaches.",
          values: [
            "Respect for our ancestors",
            "Preservation of family traditions",
            "Connection to our cultural roots",
            "Importance of family memory"
          ]
        },
        audioExplanation: "/assets/audio/level1_explanation_en.mp3"
      }
    },
    
    2: {
      es: {
        name: "Nivel Purgatorio",
        description: "El segundo nivel representa el purgatorio, el lugar de transición donde las almas esperan. Se decora con flores de cempasúchil que guían a los espíritus con su color dorado y aroma, velas que iluminan el camino, e incienso que eleva las oraciones.",
        meaning: "Este nivel simboliza la transición entre la vida y la muerte, el viaje espiritual que realizan nuestros seres queridos. Es un espacio de esperanza y guía.",
        cocoConnection: {
          description: "Como el puente de cempasúchil en Coco que conecta el mundo de los vivos con el de los muertos, este nivel representa la conexión entre ambos mundos a través del amor y la memoria.",
          quote: "Recuérdame, aunque tenga que viajar lejos",
          scene: "El momento en que Miguel cruza el puente de pétalos de cempasúchil para llegar a la Tierra de los Muertos, simbolizando la conexión entre mundos."
        },
        traditionalOfferings: [
          {
            type: "cempasuchil",
            name: "Cempasúchil",
            icon: "🌼",
            purpose: "Sus pétalos dorados guían a las almas de regreso a casa"
          },
          {
            type: "velas",
            name: "Velas",
            icon: "🕯️",
            purpose: "Iluminan el camino de las almas en la oscuridad"
          },
          {
            type: "incienso",
            name: "Incienso",
            icon: "🔥",
            purpose: "Eleva las oraciones y purifica el ambiente espiritual"
          }
        ],
        familyImportance: {
          description: "Este nivel nos enseña que el amor trasciende la muerte y que nuestros recuerdos mantienen viva la conexión familiar.",
          values: [
            "El amor trasciende la muerte",
            "Los recuerdos mantienen vivas las conexiones",
            "La importancia de guiar a nuestros seres queridos",
            "La esperanza en el reencuentro familiar"
          ]
        },
        audioExplanation: "/assets/audio/level2_explanation_es.mp3"
      },
      en: {
        name: "Purgatory Level",
        description: "The second level represents purgatory, the place of transition where souls wait. It's decorated with marigold flowers that guide spirits with their golden color and aroma, candles that illuminate the path, and incense that elevates prayers.",
        meaning: "This level symbolizes the transition between life and death, the spiritual journey our loved ones take. It's a space of hope and guidance.",
        cocoConnection: {
          description: "Like the marigold bridge in Coco that connects the world of the living with the dead, this level represents the connection between both worlds through love and memory.",
          quote: "Remember me, though I have to travel far",
          scene: "The moment when Miguel crosses the bridge of marigold petals to reach the Land of the Dead, symbolizing the connection between worlds."
        },
        traditionalOfferings: [
          {
            type: "cempasuchil",
            name: "Marigold",
            icon: "🌼",
            purpose: "Their golden petals guide souls back home"
          },
          {
            type: "velas",
            name: "Candles",
            icon: "🕯️",
            purpose: "Illuminate the path of souls in darkness"
          },
          {
            type: "incienso",
            name: "Incense",
            icon: "🔥",
            purpose: "Elevates prayers and purifies the spiritual environment"
          }
        ],
        familyImportance: {
          description: "This level teaches us that love transcends death and that our memories keep family connections alive.",
          values: [
            "Love transcends death",
            "Memories keep connections alive",
            "The importance of guiding our loved ones",
            "Hope in family reunion"
          ]
        },
        audioExplanation: "/assets/audio/level2_explanation_en.mp3"
      }
    },
    
    3: {
      es: {
        name: "Nivel Celestial",
        description: "El tercer nivel representa el cielo, donde descansan nuestros seres queridos. Aquí se colocan fotografías, objetos personales, comida favorita y todo aquello que los conecta con nosotros. Es el nivel más personal y emotivo del altar.",
        meaning: "Este nivel simboliza la eternidad y la paz celestial. Es donde honramos la individualidad de cada ser querido y celebramos su vida única.",
        cocoConnection: {
          description: "Como la música en Coco que mantiene viva la memoria de Héctor, este nivel celebra las memorias individuales que hacen únicos a nuestros seres queridos. Cada fotografía es como una canción que preserva su esencia.",
          quote: "La música es la única forma de llegar al otro lado",
          scene: "Cuando Miguel toca 'Remember Me' para Coco y ella recuerda a su padre Héctor, demostrando cómo los recuerdos personales mantienen viva a la familia."
        },
        traditionalOfferings: [
          {
            type: "foto",
            name: "Fotografías",
            icon: "📷",
            purpose: "Mantienen presente la imagen y memoria de nuestros seres queridos"
          },
          {
            type: "comida",
            name: "Comida Favorita",
            icon: "🍽️",
            purpose: "Los platillos que más disfrutaban en vida"
          },
          {
            type: "objetos_personales",
            name: "Objetos Personales",
            icon: "💎",
            purpose: "Pertenencias que los representan y conectan con nosotros"
          }
        ],
        familyImportance: {
          description: "El nivel celestial nos recuerda que cada miembro de la familia es único e irreemplazable, y que sus memorias individuales enriquecen nuestra historia familiar.",
          values: [
            "Celebración de la individualidad",
            "Preservación de memorias personales",
            "Conexión emocional con los difuntos",
            "Importancia de los recuerdos específicos"
          ]
        },
        audioExplanation: "/assets/audio/level3_explanation_es.mp3"
      },
      en: {
        name: "Heavenly Level",
        description: "The third level represents heaven, where our loved ones rest. Here we place photographs, personal objects, favorite food, and everything that connects them with us. It's the most personal and emotional level of the altar.",
        meaning: "This level symbolizes eternity and heavenly peace. It's where we honor the individuality of each loved one and celebrate their unique life.",
        cocoConnection: {
          description: "Like the music in Coco that keeps Héctor's memory alive, this level celebrates the individual memories that make our loved ones unique. Each photograph is like a song that preserves their essence.",
          quote: "Music is the only way to reach the other side",
          scene: "When Miguel plays 'Remember Me' for Coco and she remembers her father Héctor, showing how personal memories keep family alive."
        },
        traditionalOfferings: [
          {
            type: "foto",
            name: "Photographs",
            icon: "📷",
            purpose: "Keep present the image and memory of our loved ones"
          },
          {
            type: "comida",
            name: "Favorite Food",
            icon: "🍽️",
            purpose: "The dishes they most enjoyed in life"
          },
          {
            type: "objetos_personales",
            name: "Personal Objects",
            icon: "💎",
            purpose: "Belongings that represent them and connect with us"
          }
        ],
        familyImportance: {
          description: "The heavenly level reminds us that each family member is unique and irreplaceable, and that their individual memories enrich our family history.",
          values: [
            "Celebration of individuality",
            "Preservation of personal memories",
            "Emotional connection with the deceased",
            "Importance of specific memories"
          ]
        },
        audioExplanation: "/assets/audio/level3_explanation_en.mp3"
      }
    }
  },

  offerings: {
    cempasuchil: {
      es: {
        name: "Cempasúchil",
        description: "La flor de los muertos, también conocida como flor de veinte pétalos. Su color dorado brillante y su aroma distintivo guían a las almas de regreso a casa.",
        meaning: "Representa el sol y la luz que guía a los espíritus. Su nombre náhuatl significa 'flor de veinte pétalos' y es considerada sagrada en la cultura mexicana.",
        cocoConnection: {
          description: "En Coco, los pétalos de cempasúchil forman el puente mágico entre el mundo de los vivos y los muertos, simbolizando cómo el amor y la memoria conectan ambos mundos.",
          quote: "Los pétalos nos guían de regreso a casa",
          scene: "El espectacular puente de pétalos dorados que Miguel debe cruzar para llegar a la Tierra de los Muertos."
        },
        traditionalUse: "Se esparcen pétalos desde la tumba hasta el altar para crear un camino que guíe a las almas. También se usan para decorar el altar y crear coronas.",
        audioExplanation: "/assets/audio/cempasuchil_explanation_es.mp3"
      },
      en: {
        name: "Marigold",
        description: "The flower of the dead, also known as the twenty-petal flower. Its bright golden color and distinctive aroma guide souls back home.",
        meaning: "Represents the sun and light that guides spirits. Its Nahuatl name means 'twenty-petal flower' and is considered sacred in Mexican culture.",
        cocoConnection: {
          description: "In Coco, marigold petals form the magical bridge between the world of the living and the dead, symbolizing how love and memory connect both worlds.",
          quote: "The petals guide us back home",
          scene: "The spectacular bridge of golden petals that Miguel must cross to reach the Land of the Dead."
        },
        traditionalUse: "Petals are scattered from the grave to the altar to create a path that guides souls. They're also used to decorate the altar and create wreaths.",
        audioExplanation: "/assets/audio/cempasuchil_explanation_en.mp3"
      }
    },

    pan_de_muerto: {
      es: {
        name: "Pan de Muerto",
        description: "Pan dulce tradicional con forma circular que representa el ciclo de la vida y la muerte. Decorado con 'huesitos' de masa que simbolizan los huesos.",
        meaning: "Su forma circular representa el ciclo eterno de la vida. Los 'huesitos' en la superficie simbolizan los huesos de los difuntos, recordándonos la fragilidad y belleza de la vida.",
        cocoConnection: {
          description: "Como la música que une generaciones en Coco, el pan de muerto une a las familias en una tradición compartida que pasa de generación en generación.",
          quote: "Las tradiciones nos conectan con quienes amamos",
          scene: "Las escenas familiares donde se comparten alimentos tradicionales, mostrando cómo la comida une a las familias a través del tiempo."
        },
        traditionalUse: "Se coloca en el altar como ofrenda y se comparte entre la familia durante la celebración. Cada región tiene su propia receta tradicional.",
        audioExplanation: "/assets/audio/pan_de_muerto_explanation_es.mp3"
      },
      en: {
        name: "Bread of the Dead",
        description: "Traditional sweet bread with a circular shape representing the cycle of life and death. Decorated with dough 'little bones' that symbolize bones.",
        meaning: "Its circular shape represents the eternal cycle of life. The 'little bones' on the surface symbolize the bones of the deceased, reminding us of life's fragility and beauty.",
        cocoConnection: {
          description: "Like the music that unites generations in Coco, bread of the dead unites families in a shared tradition passed from generation to generation.",
          quote: "Our traditions connect us with those we love",
          scene: "Family scenes where traditional foods are shared, showing how food unites families across time."
        },
        traditionalUse: "Placed on the altar as an offering and shared among family during the celebration. Each region has its own traditional recipe.",
        audioExplanation: "/assets/audio/pan_de_muerto_explanation_en.mp3"
      }
    },

    agua: {
      es: {
        name: "Agua",
        description: "Elemento esencial de la vida, se coloca en el altar para calmar la sed de las almas que regresan del largo viaje desde el más allá.",
        meaning: "Representa la pureza, la vida y la renovación. Es uno de los cuatro elementos básicos necesarios para la supervivencia espiritual.",
        cocoConnection: {
          description: "Como las lágrimas de alegría cuando Miguel se reencuentra con su familia en Coco, el agua representa las emociones puras y la conexión vital entre los mundos.",
          quote: "El agua de la vida nos conecta a todos",
          scene: "Los momentos emotivos de reencuentro familiar que muestran cómo las emociones puras nos conectan con nuestros seres queridos."
        },
        traditionalUse: "Se coloca en vasos o jarras de barro en el altar. Algunas familias usan agua bendita o agua de lugares sagrados.",
        audioExplanation: "/assets/audio/agua_explanation_es.mp3"
      },
      en: {
        name: "Water",
        description: "Essential element of life, placed on the altar to quench the thirst of souls returning from the long journey from beyond.",
        meaning: "Represents purity, life, and renewal. It's one of the four basic elements necessary for spiritual survival.",
        cocoConnection: {
          description: "Like the tears of joy when Miguel reunites with his family in Coco, water represents pure emotions and the vital connection between worlds.",
          quote: "The water of life connects us all",
          scene: "The emotional moments of family reunion that show how pure emotions connect us with our loved ones."
        },
        traditionalUse: "Placed in glasses or clay pitchers on the altar. Some families use holy water or water from sacred places.",
        audioExplanation: "/assets/audio/agua_explanation_en.mp3"
      }
    },

    sal: {
      es: {
        name: "Sal",
        description: "Mineral esencial que se usa para purificar y preservar. En el altar, protege a las almas durante su viaje y purifica el ambiente espiritual.",
        meaning: "Simboliza la purificación y la preservación. Protege contra las energías negativas y mantiene puro el espacio sagrado del altar.",
        cocoConnection: {
          description: "Como la bendición de la familia que protege a Miguel en su aventura en Coco, la sal protege y purifica el espacio sagrado donde honramos a nuestros seres queridos.",
          quote: "La bendición familiar nos protege siempre",
          scene: "Cuando la familia bendice a Miguel antes de su viaje, mostrando cómo el amor familiar nos protege en nuestros caminos."
        },
        traditionalUse: "Se coloca en pequeños platos o se esparce alrededor del altar para crear un círculo de protección espiritual.",
        audioExplanation: "/assets/audio/sal_explanation_es.mp3"
      },
      en: {
        name: "Salt",
        description: "Essential mineral used to purify and preserve. On the altar, it protects souls during their journey and purifies the spiritual environment.",
        meaning: "Symbolizes purification and preservation. Protects against negative energies and keeps the sacred altar space pure.",
        cocoConnection: {
          description: "Like the family blessing that protects Miguel on his adventure in Coco, salt protects and purifies the sacred space where we honor our loved ones.",
          quote: "Family blessing always protects us",
          scene: "When the family blesses Miguel before his journey, showing how family love protects us on our paths."
        },
        traditionalUse: "Placed in small dishes or scattered around the altar to create a circle of spiritual protection.",
        audioExplanation: "/assets/audio/sal_explanation_en.mp3"
      }
    },

    velas: {
      es: {
        name: "Velas",
        description: "Las velas iluminan el camino de las almas en la oscuridad y representan la luz eterna del amor familiar que nunca se apaga.",
        meaning: "Simbolizan la luz, la esperanza y la guía espiritual. Su llama representa el alma eterna y la conexión continua con nuestros seres queridos.",
        cocoConnection: {
          description: "Como la luz que guía a Miguel a través de la Tierra de los Muertos en Coco, las velas representan la luz del amor familiar que nos guía siempre.",
          quote: "La luz del amor familiar nunca se apaga",
          scene: "Los momentos iluminados por la luz cálida en la Tierra de los Muertos, mostrando cómo el amor familiar ilumina incluso los lugares más oscuros."
        },
        traditionalUse: "Se encienden durante toda la celebración. Cada vela puede representar a un ser querido específico o una intención particular.",
        audioExplanation: "/assets/audio/velas_explanation_es.mp3"
      },
      en: {
        name: "Candles",
        description: "Candles illuminate the path of souls in darkness and represent the eternal light of family love that never goes out.",
        meaning: "Symbolize light, hope, and spiritual guidance. Their flame represents the eternal soul and continuous connection with our loved ones.",
        cocoConnection: {
          description: "Like the light that guides Miguel through the Land of the Dead in Coco, candles represent the light of family love that always guides us.",
          quote: "The light of family love never goes out",
          scene: "The moments illuminated by warm light in the Land of the Dead, showing how family love illuminates even the darkest places."
        },
        traditionalUse: "Lit throughout the celebration. Each candle can represent a specific loved one or particular intention.",
        audioExplanation: "/assets/audio/velas_explanation_en.mp3"
      }
    }
  },

  cocoThemes: {
    familyMemory: {
      es: {
        title: "La Memoria Familiar",
        description: "En Coco aprendemos que recordar a nuestros seres queridos es lo que los mantiene vivos en nuestros corazones. Cada fotografía en el altar es como una canción que preserva su esencia.",
        connection: "El altar de muertos es la manifestación física de esta enseñanza: cada elemento colocado es un acto de memoria que mantiene viva la conexión familiar.",
        keyLessons: [
          "La memoria es lo que mantiene viva a nuestra familia",
          "Cada recuerdo es un tesoro que debemos preservar",
          "Las fotografías son ventanas al alma de nuestros seres queridos",
          "Olvidar a alguien es la verdadera muerte"
        ],
        practicalApplication: "En Mictla, cada memorial que creas es como tocar 'Remember Me' para tus seres queridos, manteniéndolos vivos en el mundo digital."
      },
      en: {
        title: "Family Memory",
        description: "In Coco we learn that remembering our loved ones is what keeps them alive in our hearts. Each photograph on the altar is like a song that preserves their essence.",
        connection: "The Day of the Dead altar is the physical manifestation of this teaching: each element placed is an act of memory that keeps family connection alive.",
        keyLessons: [
          "Memory is what keeps our family alive",
          "Each memory is a treasure we must preserve",
          "Photographs are windows to our loved ones' souls",
          "Forgetting someone is the real death"
        ],
        practicalApplication: "In Mictla, each memorial you create is like playing 'Remember Me' for your loved ones, keeping them alive in the digital world."
      }
    },
    musicAndTradition: {
      es: {
        title: "Música y Tradición",
        description: "La música en Coco representa cómo las tradiciones se transmiten de generación en generación, conectando el pasado con el presente.",
        connection: "Como la música, el altar de muertos es una tradición que se transmite en las familias, manteniendo vivas las conexiones generacionales.",
        keyLessons: [
          "Las tradiciones son la música de nuestra cultura",
          "Cada generación añade su propia melodía a la historia familiar",
          "La música trasciende la muerte y conecta mundos",
          "Las canciones familiares preservan nuestra identidad"
        ],
        practicalApplication: "En Mictla, puedes grabar mensajes de voz que, como las canciones de Coco, preservarán la voz y esencia de tus seres queridos."
      },
      en: {
        title: "Music and Tradition",
        description: "Music in Coco represents how traditions are transmitted from generation to generation, connecting past with present.",
        connection: "Like music, the Day of the Dead altar is a tradition transmitted in families, keeping generational connections alive.",
        keyLessons: [
          "Traditions are the music of our culture",
          "Each generation adds its own melody to family history",
          "Music transcends death and connects worlds",
          "Family songs preserve our identity"
        ],
        practicalApplication: "In Mictla, you can record voice messages that, like Coco's songs, will preserve the voice and essence of your loved ones."
      }
    },
    familyFirst: {
      es: {
        title: "La Familia Primero",
        description: "El mensaje central de Coco es que 'la familia es lo más importante'. Esta enseñanza se refleja en cómo el altar de muertos reúne a toda la familia, vivos y muertos, en un mismo espacio sagrado.",
        connection: "El altar no es solo para recordar a los muertos, sino para fortalecer los lazos entre los vivos, enseñando a las nuevas generaciones sobre sus raíces.",
        keyLessons: [
          "La familia es nuestra raíz, historia e identidad",
          "Los conflictos familiares se sanan con comprensión y amor",
          "Cada miembro de la familia tiene una historia valiosa",
          "Las decisiones familiares afectan a todas las generaciones"
        ],
        practicalApplication: "Mictla te permite crear un espacio donde toda tu familia puede contribuir y compartir memorias, fortaleciendo los lazos familiares como en Coco.",
        cocoMoments: [
          "Cuando Miguel comprende que la música no era más importante que la familia",
          "El momento en que Héctor y Ernesto revelan la verdad sobre la familia",
          "La reconciliación de Miguel con su familia al final"
        ]
      },
      en: {
        title: "Family First",
        description: "Coco's central message is that 'family is everything'. This teaching is reflected in how the Day of the Dead altar brings the whole family together, living and dead, in the same sacred space.",
        connection: "The altar is not just for remembering the dead, but for strengthening bonds among the living, teaching new generations about their roots.",
        keyLessons: [
          "Family is our root, history, and identity",
          "Family conflicts heal with understanding and love",
          "Each family member has a valuable story",
          "Family decisions affect all generations"
        ],
        practicalApplication: "Mictla allows you to create a space where your whole family can contribute and share memories, strengthening family bonds like in Coco.",
        cocoMoments: [
          "When Miguel understands that music wasn't more important than family",
          "The moment when Héctor and Ernesto reveal the truth about family",
          "Miguel's reconciliation with his family at the end"
        ]
      }
    },
    bridgeBetweenWorlds: {
      es: {
        title: "El Puente Entre Mundos",
        description: "En Coco, el puente de cempasúchil conecta físicamente el mundo de los vivos con el de los muertos. Este puente simboliza cómo el amor y la memoria trascienden la muerte.",
        connection: "El altar de muertos es nuestro propio puente de cempasúchil, un espacio donde los dos mundos se encuentran y donde podemos 'visitar' a nuestros seres queridos.",
        keyLessons: [
          "El amor trasciende la muerte física",
          "Los recuerdos son puentes que conectan mundos",
          "La muerte no es el final, sino una transformación",
          "Podemos 'visitar' a nuestros seres queridos a través de la memoria"
        ],
        practicalApplication: "En Mictla, la experiencia AR crea un puente digital donde puedes 'encontrarte' con tus seres queridos en el altar virtual.",
        symbolism: {
          cempasuchilBridge: "Los pétalos dorados guían a las almas de regreso a casa",
          altarAsPortal: "El altar funciona como un portal entre dimensiones",
          memoriesAsPassport: "Los recuerdos son nuestro pasaporte para cruzar entre mundos"
        }
      },
      en: {
        title: "The Bridge Between Worlds",
        description: "In Coco, the marigold bridge physically connects the world of the living with the dead. This bridge symbolizes how love and memory transcend death.",
        connection: "The Day of the Dead altar is our own marigold bridge, a space where both worlds meet and where we can 'visit' our loved ones.",
        keyLessons: [
          "Love transcends physical death",
          "Memories are bridges that connect worlds",
          "Death is not the end, but a transformation",
          "We can 'visit' our loved ones through memory"
        ],
        practicalApplication: "In Mictla, the AR experience creates a digital bridge where you can 'meet' your loved ones at the virtual altar.",
        symbolism: {
          cempasuchilBridge: "Golden petals guide souls back home",
          altarAsPortal: "The altar functions as a portal between dimensions",
          memoriesAsPassport: "Memories are our passport to cross between worlds"
        }
      }
    },
    forgettingVsRemembering: {
      es: {
        title: "Recordar vs Olvidar",
        description: "Coco nos enseña que la verdadera muerte no es física, sino ser olvidado. Héctor se desvanece cuando nadie lo recuerda, pero revive cuando Coco canta su canción.",
        connection: "El altar de muertos es un acto de resistencia contra el olvido, una promesa de que nuestros seres queridos nunca serán olvidados.",
        keyLessons: [
          "Ser olvidado es la verdadera muerte",
          "Cada acto de memoria es un acto de amor",
          "Las historias familiares deben ser contadas y recontadas",
          "Somos responsables de mantener viva la memoria de nuestros seres queridos"
        ],
        practicalApplication: "Mictla digitaliza y preserva las memorias familiares, asegurando que nunca se pierdan y puedan ser compartidas con futuras generaciones.",
        rememberingActions: [
          "Contar historias sobre nuestros seres queridos",
          "Mostrar fotografías y explicar quiénes eran",
          "Mantener vivas sus tradiciones y recetas",
          "Enseñar a los niños sobre sus antepasados"
        ]
      },
      en: {
        title: "Remembering vs Forgetting",
        description: "Coco teaches us that true death is not physical, but being forgotten. Héctor fades when no one remembers him, but comes back to life when Coco sings his song.",
        connection: "The Day of the Dead altar is an act of resistance against forgetting, a promise that our loved ones will never be forgotten.",
        keyLessons: [
          "Being forgotten is the real death",
          "Each act of memory is an act of love",
          "Family stories must be told and retold",
          "We are responsible for keeping our loved ones' memory alive"
        ],
        practicalApplication: "Mictla digitalizes and preserves family memories, ensuring they are never lost and can be shared with future generations.",
        rememberingActions: [
          "Tell stories about our loved ones",
          "Show photographs and explain who they were",
          "Keep their traditions and recipes alive",
          "Teach children about their ancestors"
        ]
      }
    }
  },

  traditionalOfferings: {
    categories: {
      essential: {
        es: {
          name: "Elementos Esenciales",
          description: "Los cuatro elementos básicos que no pueden faltar en ningún altar",
          items: ["agua", "sal", "velas", "incienso"]
        },
        en: {
          name: "Essential Elements",
          description: "The four basic elements that cannot be missing from any altar",
          items: ["agua", "sal", "velas", "incienso"]
        }
      },
      flowers: {
        es: {
          name: "Flores y Decoración",
          description: "Flores que guían y adornan el camino de las almas",
          items: ["cempasuchil", "flores_blancas", "coronas"]
        },
        en: {
          name: "Flowers and Decoration",
          description: "Flowers that guide and adorn the path of souls",
          items: ["cempasuchil", "flores_blancas", "coronas"]
        }
      },
      food: {
        es: {
          name: "Alimentos Tradicionales",
          description: "Comida sagrada y favorita de los difuntos",
          items: ["pan_de_muerto", "frutas", "dulces", "comida_favorita"]
        },
        en: {
          name: "Traditional Foods",
          description: "Sacred food and favorites of the deceased",
          items: ["pan_de_muerto", "frutas", "dulces", "comida_favorita"]
        }
      },
      personal: {
        es: {
          name: "Elementos Personales",
          description: "Objetos que conectan con la individualidad del difunto",
          items: ["fotografias", "objetos_personales", "instrumentos", "juguetes"]
        },
        en: {
          name: "Personal Elements",
          description: "Objects that connect with the individuality of the deceased",
          items: ["fotografias", "objetos_personales", "instrumentos", "juguetes"]
        }
      }
    },
    
    respectfulPractices: {
      es: {
        title: "Prácticas Respetuosas",
        description: "Cómo honrar las tradiciones del Día de Muertos de manera auténtica y respetuosa",
        guidelines: [
          "El altar no es decoración, es un espacio sagrado de conexión familiar",
          "Cada elemento tiene un propósito espiritual y cultural específico",
          "Las fotografías deben ser de personas realmente fallecidas, no ficticias",
          "La celebración es alegre pero reverente, honrando la memoria con respeto",
          "Las tradiciones varían por región, todas son válidas y auténticas",
          "El Día de Muertos no es 'Halloween mexicano', tiene su propio significado profundo"
        ],
        culturalSensitivity: [
          "Aprender sobre el origen prehispánico de la tradición",
          "Respetar las variaciones regionales de la celebración",
          "Entender que es una tradición viva, no un museo",
          "Reconocer la profundidad espiritual de la práctica"
        ]
      },
      en: {
        title: "Respectful Practices",
        description: "How to honor Day of the Dead traditions in an authentic and respectful way",
        guidelines: [
          "The altar is not decoration, it's a sacred space of family connection",
          "Each element has a specific spiritual and cultural purpose",
          "Photographs should be of people who have actually passed away, not fictional",
          "The celebration is joyful but reverent, honoring memory with respect",
          "Traditions vary by region, all are valid and authentic",
          "Day of the Dead is not 'Mexican Halloween', it has its own deep meaning"
        ],
        culturalSensitivity: [
          "Learn about the pre-Hispanic origin of the tradition",
          "Respect regional variations of the celebration",
          "Understand that it's a living tradition, not a museum piece",
          "Recognize the spiritual depth of the practice"
        ]
      }
    }
  }
}