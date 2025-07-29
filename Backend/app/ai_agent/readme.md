para ejecutar  el agente:
1. en tu archivo .env tienes que verificar si tienes estos datos:

MONGODB_URI=mongodb:"clave de la base de datos"
MONGODB_URI_INVENTORY=mongodb://localhost:27017/DatabaseInvetary
MONGODB_URI_BRAIN=mongodb://localhost:27017/DataUser
HUGGINGFACE_API_TOKEN=hf_tu_token_aqui  # Opcional por el momento

2. una vez verificado instala las dependencias en requirements.txt si es posible haz una entorno virtual solo para el agente para no causar conflictos

3. para ejecutar el agente escribe python agentv2.py