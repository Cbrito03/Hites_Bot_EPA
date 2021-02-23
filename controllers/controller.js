const local_storage = require('../controllers/local_storage.js');
const Horarios_clientes = require('../models/Horarios_clientes');
const Intentos_clientes = require('../models/Intentos_clientes');
const horario = require('../controllers/validar_horario.js');
const BotMensajes = require('../models/BotMensajes.js');
const Aut_clientes = require('../models/Aut_clientes');
const moment_timezone = require('moment-timezone');
const MsjInicial = require('../models/MsjInicial');
const Config = require('../models/Configuracion');
const Horarios = require('../models/Horarios');
const Reportes = require('../models/Reporte');
const localStorage = require('localStorage');
const xmlParser = require('xml2json');
const jquery = require('jquery');
const moment = require('moment');
const axios = require('axios');
const async = require('async');

var clientTimeoutControl = {};

var clientTimeoutControl_Aut = {};

var config = {
	authorization : "",
	token_session : "",
	url_EPA : "",
	timer_EPA : "",
	qa : "",
};

var configuraciones = {
	get_config : async function()
	{
		const result = await Config.find({"status": true});		

	    if (result.length >= 1)
	    {
	    	for (var i = 0; i < result.length; i++)
	    	{
	    		switch (result[i].titulo)
	    		{
					case 'url_EPA':
						config.url_EPA = result[i].valor;
					break;
					case 'timer_EPA':
						config.timer_EPA = result[i].valor;
					break;					
					case 'Token_Autorización':
						config.authorization = result[i].valor;
					break;
					case 'Intentos_EPA':
						config.intentos_EPA = result[i].valor;
					break;
					case 'url_EPA_insert':
						config.url_EPA_insert = result[i].valor;
					break;
					case 'QA':
						config.qa = result[i].valor;
					break;						
				}
	    	}
	    }

	    return config;	
    },
    clearClientTimeOut : async function(keyTimeout, conversationID)
    {
    	console.log("[clearClientTimeOut] [EPAEClear] [ID Cliente] :: " + keyTimeout);

    	if(clientTimeoutControl && Object.keys(clientTimeoutControl).length > 0)
    	{
    		console.log("[clearClientTimeOut] [EPAEClear] [Existe llave] :: " + clientTimeoutControl.hasOwnProperty(keyTimeout));

    		if(clientTimeoutControl.hasOwnProperty(keyTimeout))
    		{
    			console.log("[clearClientTimeOut] [EPAEClear] [Se detiene el timer y se elimina el objeto] :: " + keyTimeout);
    			
    			clearTimeout(clientTimeoutControl[keyTimeout].timeOut);

				localStorage.removeItem("preguntas_EPA_"+keyTimeout);
				localStorage.removeItem("intento_EPA"+conversationID);
				localStorage.removeItem("preguntas_EPA_1"+keyTimeout);
				localStorage.removeItem("preguntas_EPA_2"+keyTimeout);

    			delete clientTimeoutControl[keyTimeout];
    		}
    	}
    },
    clearClientTimeOut_Aut : async function(id,user, bandera = false)
    {
    	console.log("[clearClientTimeOut_Aut] [Clear] [ID Cliente] :: ", id, " :: Bandera :: ", bandera);

    	if(bandera)
    	{
    		console.log("[clearClientTimeOut_Aut] [Clear] [Se detiene el timer y se elimina el objeto] :: ", bandera);
    		clearTimeout(clientTimeoutControl_Aut[id].timeOut);
    		delete clientTimeoutControl_Aut[id];
	    }
	    else
	    {	    	
	    	if(clientTimeoutControl_Aut && Object.keys(clientTimeoutControl_Aut).length > 0)
	    	{
	    		console.log("[clearClientTimeOut_Aut] [Clear] [Existe llave] :: " + clientTimeoutControl_Aut.hasOwnProperty(id));

	    		if(clientTimeoutControl_Aut.hasOwnProperty(id))
	    		{
	    			console.log("[clearClientTimeOut_Aut] [Clear] [Se detiene el timer y se elimina el objeto] :: " + id);
	    			
	    			clearTimeout(clientTimeoutControl_Aut[id].timeOut);

					localStorage.removeItem("preguntas_EPA_"+user.id);
					localStorage.removeItem("intento_EPA"+id);
					localStorage.removeItem("preguntas_EPA_1"+user.id);
					localStorage.removeItem("preguntas_EPA_2"+user.id);

					funciones.registrar_aut_clientes(user);

	    			delete clientTimeoutControl_Aut[id];
	    		}
	    	}
	    }
    }
};

var texto = {   
    cargar_preguntas_EPA: async function()
	{
		var obj = "";

	    const result = await BotMensajes.find({"status": true, "titulo" : "Preguntas EPA"});

	    if (result.length >= 1)
	    {
	    	obj = result[0];	    	
	    }

	    return obj;
    },
    cargar_inicio_EPA: async function()
	{
		var obj = "";

	    const result = await BotMensajes.find({"status": true, "titulo" : "Inicio EPA"});

	    if (result.length >= 1)
	    {
	    	obj = result[0];	    	
	    }

	    return obj;
    },
    cargar_fin_EPA: async function()
	{
		var obj = "";

	    const result = await BotMensajes.find({"status": true, "titulo" : "Fin EPA"});

	    if (result.length >= 1)
	    {
	    	obj = result[0];	    	
	    }

	    return obj;
    }
}

var funciones = {	
    registrar_preguntas_EPA: async function(data)
	{

    	console.log("[Controller] :: [registrar_preguntas_EPA] :: [data] :: ", data);		

	   	var options = {
            method : 'POST',
            url : config.url_EPA,
            headers : { 
              'Content-Type':'application/json'
        	},
        	data: data
      	};

      	var get_config = await configuraciones.get_config();

      	console.log("[Controller] :: [registrar_preguntas_EPA] :: [config_qa] :: ", get_config.qa);

      	if(get_config.qa == "false")
      	{
			await axios(options).then(function (response)
			{
	            if(response.status == 200 && response.statusText == 'OK')
	            {
					console.log("[registrar_preguntas_EPA] :: [EPA] :: [then OK] :: [response]:: ", response);
	        	}
	            else
	            {
					console.log("[registrar_preguntas_EPA] :: [EPA] :: [then NOK] :: [response]:: ", response);
	        	}
			})
	      	.catch(function (error)
	      	{
	            resultado.status = error.response.data.status;
	            resultado.message = error.response.data.message;

	        	console.log("[terminateConversation] :: [EPA] :: [ERROR] :: [status]:: " + resultado.status + " :: [EPAMenssage] :: " + resultado.message);
	      	});

	      	console.log("[Controller] :: [registrar_preguntas_EPA] :: " +  result.status);
      	}
      	else
      	{
      		console.log("[Controller] :: [registrar_preguntas_EPA] :: [QA] :: [OK]");
      	}
    },
    startClientTimeOut : async function(e,data, conversationId)
    {
    	console.log("[startClientTimeOut] [EPA Start Timer] [IDCliente] :: " + e);

    	var get_config = await configuraciones.get_config();

    	var msj_fin_EPA = await texto.cargar_fin_EPA();

    	var tiempo = Math.floor(parseInt(get_config.timer_EPA) * 60000);

    	console.log("[startClientTimeOut] [EPA Start Timer] [Tiempo] :: " + tiempo);

    	console.log("[startClientTimeOut] [EPA Start Timer] [Data] :: ", data);

    	data.systemMessage = "EPA NO RESPONDIDO";
    	data.botNotification = false;
    	data.data["text"] = msj_fin_EPA.messages[0].text;

    	clientTimeoutControl[e] = {
			dato: data,
			timeOut: ""		  
		};

		console.log("[startClientTimeOut] [EPADatos] :: [data channel] :: " + data.channel);
            console.log("[startClientTimeOut] [EPADatos] :: [data userID] :: " + data.userID);
            console.log("[startClientTimeOut] [EPADatos] :: [data orgID] :: " + data.orgID);
            console.log("[startClientTimeOut] [EPADatos] :: [data data Text :: " + data.data.text);
            console.log("[startClientTimeOut] [EPADatos] :: [data userID] :: " + data.userID);
            console.log("[startClientTimeOut] [EPADatos] :: [get_config.url_EPA] :: " + get_config.url_EPA);
            console.log("[startClientTimeOut] [EPADatos] :: [get_config.authorization] :: " + get_config.authorization);

        var get_config = await configuraciones.get_config();
            
		clientTimeoutControl[e].timeOut = setTimeout( () =>
		{
			console.log("[startClientTimeOut] [Inicia el Timer] [setTimeout] :: " + e);		

	      	console.log("[Controller] :: [startClientTimeOut] :: [config_qa] :: ", get_config.qa);

	      	if(get_config.qa == "false")
	      	{
				var options = {
		            method : 'POST',
		            url : get_config.url_EPA,
		            headers : { 
		              'Content-Type':'application/json',
		              'Authorization': get_config.authorization //"Bearer eyKhbGciOiJIUzdxmklamwkdqwnondqown.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IlNpeGJlbGwgQ29udmVyc2F0aW9ucyIsImFkbWluIjp0cnVlLCJpYXQiOjE1MTYyMzkwMjJ9.UIFndsadskacascda_dasda878Cassda_XxsaSllip0__saWEasqwed2341cfSAS"
		            },
		            data: data
		        };

		        axios(options).then(function (response)
				{
					console.log("[startClientTimeOut] [EPAOK] [status] :: " + response.data.status + " :: [EPAMenssage] :: " + response.data.message);
					configuraciones.clearClientTimeOut(e);
				})
				.catch(function (error)
				{
					console.log("[startClientTimeOut] [EPAERROR] [status] :: ", error);
					configuraciones.clearClientTimeOut(e);
				});

				console.log("[startClientTimeOut] [EPATimer] [ID Cliente]  :: " + e);
			}
			else
			{
				console.log("[startClientTimeOut] [EPATimer] [QA]  :: [OK]", data);
			}

			const rest_EPA = {
		    	"converasacionID" : conversationId,
			    "ani": e,
			    "pregunta_uno": localStorage.getItem("preguntas_EPA_1"+e),
			    "pregunta_dos": localStorage.getItem("preguntas_EPA_2"+e),
			    "pregunta_tres": localStorage.getItem("preguntas_EPA_2"+e)
		    };

			funciones.registrar_preguntas_EPA(rest_EPA);
		}, tiempo);				
    }, 
    valida_respuesta_EPA: async function(valor, num)
    {
    	var result = false;

    	var expresion = "";

    	switch (num) {
		  case 1:
		    expresion = /^[1-5]+$/;
		    break;
		  case 2:
		    expresion = /^[1-2]+$/;
		    break;
		  case 3:
		    expresion = /^[1-5]+$/;
		    break;		  
		  default:
		    expresion = /^[1-5]+$/;
		}

    	console.log("[controller] :: [valida_respuesta_EPA] :: [expresion] :: ", expresion);

    	valor = valor.trim();

    	console.log("[controller] :: [valida_respuesta_EPA] :: " + valor);

		if(valor != "")
		{
			console.log();

			if (expresion.test(valor)) 
			{
				console.log("[controller] :: [valida_respuesta_EPA] :: " + true);
			    result = true;
			}		

			console.log('[controller] :: [valida_respuesta_EPA] :: ', result);
		}

    	return result;
    },    
    startClientTimeOut_Aut : async function(id,tel)
    {
    	console.log("[startClientTimeOut_Aut] [Aut Start Timer] [IDCliente] :: " + id);

    	var get_config = await configuraciones.get_config();

    	var tiempo = Math.floor(parseInt(get_config.timer_EPA) * 60000);

    	console.log("[startClientTimeOut_Aut] [EPA Start Timer] [Tiempo] :: " + tiempo);    	

    	clientTimeoutControl_Aut[id] = {
			timeOut: ""		  
		};
		 
		clientTimeoutControl_Aut[id].timeOut = setTimeout( () =>
		{
			console.log("[startClientTimeOut_Aut] [Inicia el Timer] [setTimeout] :: " + id);
			
			configuraciones.clearClientTimeOut_Aut(id, tel);
			
		}, tiempo);				
    }
}

exports.configuraciones = configuraciones;
exports.funciones = funciones;
exports.texto = texto;