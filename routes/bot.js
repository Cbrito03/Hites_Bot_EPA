const local_storage = require('../controllers/local_storage.js');
const horario = require('../controllers/validar_horario.js');
const controlador = require('../controllers/controller.js');
const moment_timezone = require('moment-timezone');
const Horarios = require('../models/Horarios');
const localStorage = require('localStorage');
const express = require('express');
const moment = require('moment');
const axios = require('axios');
const async = require('async');

const router = express.Router();

const setStorage = local_storage.setStorage;
const getStorage = local_storage.getStorage;
const removeStorage = local_storage.removeStorage;

router.post('/message_EPA', async (req, res) => {

	console.log("[BCI] :: [POST MESSAGE /message_EPA] ");

	var conversationID = req.body.conversationId;
	var channel = req.body.channel;
	var user = req.body.user;
	var mensaje = req.body.message;
	var context = req.body.context;

	var estatus = 200;

	var resultado = {
		"context": context,
		"action": {},
		"messages": [],
		"additionalInfo": {
			"key":"RUT",
			"RUT":"1-9",
			"authValidity": ""
		}
	}

	var now = moment();
		var fechaStamp = moment(context.lastMessageTime).subtract(3, 'hours');
		var fechaStamp2 = moment(context.lastInteractionFinishTime).subtract(3, 'hours');
		fechaStamp = moment(fechaStamp).format("YYYY-MM-DD HH:mm:ss");
		var fecha_actual = now.tz("America/Santiago").format("YYYY-MM-DD HH:mm:ss");
		var fecha2 = moment(fecha_actual, "YYYY-MM-DD HH:mm:ss");

	//console.log("lastInteractionFinishTime :: " + fechaStamp2 + ":: lastMessageTime :: "+fechaStamp+" ::fecha Actual :: " + fecha_actual);

	var diff = fecha2.diff(fechaStamp, 'h'); 
	//console.log("diff :: " + diff + " Tipo " + typeof diff);

	// Obtener mensajes de la base de datos
		
	var msj_preguntas_EPA = await controlador.texto.cargar_preguntas_EPA();
	var msj_fin_EPA = await controlador.texto.cargar_fin_EPA();
	var config = await controlador.configuraciones.get_config();

	var local_function = {
		fin_EPA : async function(e)
		{
			console.log("[local_function] :: [fin EPA]");
			if(e)
			{
				resultado.action = msj_fin_EPA.action;
				resultado.messages.push(msj_fin_EPA.messages[0]);
			}
			else
			{
				resultado.action = msj_fin_EPA.action;
				resultado.messages.push(msj_fin_EPA.messages[0]);
				resultado.additionalInfo.authValidity = false;
			}   
		},	
		remove_localStorage : async function()
		{
			console.log("[local_function] :: [remove_localStorage]");

			localStorage.removeItem("preguntas_EPA_"+user.id);
			localStorage.removeItem("intento_EPA"+conversationID);
			localStorage.removeItem("preguntas_EPA_1"+user.id);
			localStorage.removeItem("preguntas_EPA_2"+user.id);
		}
	}	
		
	if(channel !== '' && typeof channel !== "undefined") 
	{
		if(user !== '' && typeof user !== "undefined") 
		{
			if(context !== '' && typeof context !== "undefined") 
			{
				if(mensaje !== '' && typeof mensaje !== "undefined") 
				{
					mensaje = mensaje.text.trim();

					config_intentos = parseInt(config.intentos_EPA);

					//console.log("[BCI] :: [message] :: [lastMessageFrom] :: " + context.lastMessageFrom + " :: [Diferecnia] :: " + diff);          

					/*if((context.lastMessageFrom == "NOTIFICATION" && diff < 24) || (localStorage.getItem("NOTIFICATION"+user.id) == "NOTIFICATION" && diff < 24))
					{*/
		                // Aplico Flujo de la EPA (Preguntas que tengo que guardar en una colección)
		               
		                console.log("[EPA] :: [pregunta_EPA] :: " + localStorage.getItem("preguntas_EPA_"+user.id));

		                var num_intentos_EPA = localStorage.getItem("intento_EPA"+conversationID);

		                console.log("[EPA] :: [num_intentos_EPA] :: ", num_intentos_EPA);
		                console.log("[EPA] :: [preguntas_EPA_] :: ",localStorage.getItem("preguntas_EPA_"+user.id));

						if(num_intentos_EPA == null || num_intentos_EPA == "null") { num_intentos_EPA = 0; }

		                if(localStorage.getItem("preguntas_EPA_"+user.id) == "0") // Pregunta 1
						{	
							num_intentos_EPA = parseInt(num_intentos_EPA) + 1;

							console.log("[EPA] :: [Pregunta 1] ::  [num_intentos_EPA] :: ", num_intentos_EPA);

							var valida_respuesta = await controlador.funciones.valida_respuesta_EPA(mensaje, 1);

							console.log("[EPA] :: [Respuesta_EPA] :: [valida_respuesta] :: ", localStorage.getItem("preguntas_EPA_"+user.id), valida_respuesta);

							localStorage.setItem("intento_EPA"+conversationID, num_intentos_EPA);

							if(valida_respuesta && num_intentos_EPA <= config_intentos) //  1 <= 2 true
							{
            					console.log("[EPA] :: [Respuesta_EPA_1] :: [Entro al IF] ", valida_respuesta);
			                                     
								resultado.action = msj_preguntas_EPA.action;
								resultado.messages.push(msj_preguntas_EPA.messages[1]);										

								localStorage.setItem("preguntas_EPA_1"+user.id, mensaje);
								localStorage.setItem("preguntas_EPA_"+user.id, "1");
								localStorage.setItem("intento_EPA"+conversationID, null);					                    
							}									
							else if(!valida_respuesta && num_intentos_EPA <= config_intentos - 1 ) // 2 <= 1 true
							{
								console.log("[EPA] :: [Respuesta_EPA_1] :: [Nuevo Intento] :: [num_intentos_EPA] :: ", num_intentos_EPA);

								resultado.action = msj_preguntas_EPA.action;
								resultado.messages.push(msj_preguntas_EPA.messages[0]);

								localStorage.setItem("intento_EPA"+conversationID, num_intentos_EPA);
							}
							else if(num_intentos_EPA >= config_intentos) //  2 >= 2 true
							{
								console.log("[EPA] :: [Respuesta_EPA_1] :: [Intentos superados] :: [num_intentos_EPA] :: ", num_intentos_EPA);

								resultado.action = msj_preguntas_EPA.action;
								resultado.messages.push(msj_preguntas_EPA.messages[1]);

								localStorage.setItem("preguntas_EPA_1"+user.id, "No Respondio");
								localStorage.setItem("preguntas_EPA_"+user.id, "1");
								localStorage.setItem("intento_EPA"+conversationID, null);
							}
						}
						else if(localStorage.getItem("preguntas_EPA_"+user.id) == "1") // Pregunta 2
						{	
							num_intentos_EPA = parseInt(num_intentos_EPA) + 1;

							console.log("[EPA] :: [Pregunta 2] ::  [num_intentos_EPA] :: ", num_intentos_EPA);

							//var expresion = msj_preguntas_EPA.messages[1].expresion;

							var valida_respuesta = await controlador.funciones.valida_respuesta_EPA(mensaje, 2);

							console.log("[EPA] :: [Respuesta_EPA] :: [valida_respuesta] :: ", localStorage.getItem("preguntas_EPA_"+user.id), valida_respuesta);

							localStorage.setItem("intento_EPA"+conversationID, num_intentos_EPA);

							if(valida_respuesta && num_intentos_EPA <= config_intentos) //  1 <= 2 true
							{
            					console.log("[EPA] :: [Respuesta_EPA_2] :: [Entro al IF] ", valida_respuesta);
			                                     
								resultado.action = msj_preguntas_EPA.action;
								resultado.messages.push(msj_preguntas_EPA.messages[2]);										

								localStorage.setItem("preguntas_EPA_2"+user.id, mensaje);
								localStorage.setItem("preguntas_EPA_"+user.id, "2");
								localStorage.setItem("intento_EPA"+conversationID, null);				                    
							}									
							else if(!valida_respuesta && num_intentos_EPA <= config_intentos - 1 ) // 2 <= 1 true
							{
								console.log("[EPA] :: [Respuesta_EPA_2] :: [Nuvo Intento] :: [num_intentos_EPA] :: ", num_intentos_EPA);

								resultado.action = msj_preguntas_EPA.action;
								resultado.messages.push(msj_preguntas_EPA.messages[1]);

								localStorage.setItem("intento_EPA"+conversationID, num_intentos_EPA);
							}
							else if(num_intentos_EPA >= config_intentos) //  2 >= 2 true
							{
								console.log("[EPA] :: [Respuesta_EPA_2] :: [Intentos superados] :: [num_intentos_EPA] :: ", num_intentos_EPA);

								resultado.action = msj_preguntas_EPA.action;
								resultado.messages.push(msj_preguntas_EPA.messages[2]);

								localStorage.setItem("preguntas_EPA_2"+user.id, "No Respondio");
								localStorage.setItem("preguntas_EPA_"+user.id, "2");
								localStorage.setItem("intento_EPA"+conversationID, null);
							}									
						}
						else if(localStorage.getItem("preguntas_EPA_"+user.id) == "2") // Pregunta 3
						{	
							num_intentos_EPA = parseInt(num_intentos_EPA) + 1;

							console.log("[EPA] :: [Pregunta 3] ::  [num_intentos_EPA] :: ", num_intentos_EPA);

							//var expresion = msj_preguntas_EPA.messages[2].expresion;

							var valida_respuesta = await controlador.funciones.valida_respuesta_EPA(mensaje, 3);

							console.log("[EPA] :: [Respuesta_EPA] :: [valida_respuesta] :: ", localStorage.getItem("preguntas_EPA_"+user.id), valida_respuesta);

							localStorage.setItem("intento_EPA"+conversationID, num_intentos_EPA);

							if(valida_respuesta && num_intentos_EPA <= config_intentos) //  1 <= 2 true
							{
            					console.log("[EPA] :: [Respuesta_EPA] :: [Entro al IF] ", valida_respuesta);	
								console.log("[EPA] :: Guardar_EPA :: ");

								resultado.action = msj_fin_EPA.action;
								resultado.messages.push(msj_fin_EPA.messages[0]);

								const rest_EPA = {
							    	"converasacionID" : conversationID,
								    "ani": user.id,
								    "pregunta_uno": localStorage.getItem("preguntas_EPA_1"+user.id),
								    "pregunta_dos": localStorage.getItem("preguntas_EPA_2"+user.id),
								    "pregunta_tres": mensaje
							    };

								await controlador.funciones.registrar_preguntas_EPA(rest_EPA);
								await controlador.configuraciones.clearClientTimeOut(user.id, conversationID);
								await local_function.remove_localStorage();			                    
							}									
							else if(!valida_respuesta && num_intentos_EPA <= config_intentos - 1 ) // 2 <= 1 true
							{
								console.log("[EPA] :: [Respuesta_EPA_3] :: [Nuevo intento] :: [num_intentos_EPA] :: ", num_intentos_EPA);

								resultado.action = msj_preguntas_EPA.action;
								resultado.messages.push(msj_preguntas_EPA.messages[2]);

								localStorage.setItem("intento_EPA"+conversationID, num_intentos_EPA);
							}
							else if(num_intentos_EPA >= config_intentos) //  2 >= 2 true
							{
								console.log("[EPA] :: [Respuesta_EPA_3] :: [Intentos superados] :: [num_intentos_EPA] :: ", num_intentos_EPA);

								resultado.action = msj_fin_EPA.action;
								resultado.messages.push(msj_fin_EPA.messages[0]);

								const rest_EPA = {
							    	"converasacionID" : conversationID,
								    "ani": user.id,
								    "pregunta_uno": localStorage.getItem("preguntas_EPA_1"+user.id),
								    "pregunta_dos": localStorage.getItem("preguntas_EPA_2"+user.id),
								    "pregunta_tres": "No Respondio"
							    };

								await controlador.funciones.registrar_preguntas_EPA(rest_EPA);
								await controlador.configuraciones.clearClientTimeOut(user.id, conversationID);
								await local_function.remove_localStorage();
							}
						}							
					/*}
					else 
					{
		                
	              	}*/

      				console.log("::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::");
				}
				else
				{
					estatus = 400;
					resultado = {
						"message": "El valor de mensaje es requerido",
						"status": "400"
					}
				} 
			}
			else
			{
				estatus = 400;
				resultado = {
					"message": "El valor de contexto es requerido",
					"status": "400"
				}
			} 
		}
		else
		{
			estatus = 400;
			resultado = {
				"message": "El valor de user es requerido",
				"status": "400"
			}
		}        
	}
	else
	{
		estatus = 400;
		resultado = {
			"message": "El valor de channel es requerido",
			"status": "400"
		}
	}

	console.log("[BCI] :: [FINAL] :: [resultado] :: [action]", resultado.action.type);
	console.log("[BCI] :: [FINAL] :: [resultado] :: [text]", resultado.messages[0].text);
	console.log("[BCI] :: [FINAL] :: [resultado] :: [authValidity]", resultado.additionalInfo.authValidity);

	res.status(estatus).json(resultado);
});

router.post('/terminateConversation', async (req, res) => {
	var resultado = {};

	console.log("[terminateConversation] :: [EPA] :: [Se envio EPA al Cliente]");

	var persona = req.body.persona;
	var ejecutivo = req.body.ejecutivo;
	var conversacion = req.body.conversacion;

  	var msj_inicio_EPA = await controlador.texto.cargar_inicio_EPA();
    var msj_pregunta_1_EPA = await controlador.texto.cargar_preguntas_EPA();
    var msj_fin_EPA = await controlador.texto.cargar_fin_EPA();
    var config = await controlador.configuraciones.get_config();

  	console.log("[terminateConversation] :: [EPA] :: [config] :: " + config.url_EPA);

	if(persona !== '' && typeof persona !== "undefined") 
	{	   
		if(conversacion !== '' && typeof conversacion !== "undefined") 
		{
			var data = {
	            "channel": "whatsapp",
	            "userID": conversacion.userId,
	            "orgID": conversacion.orgId,
	            "type": "text",
	            "destination": {
					"type": "recipient",
					"recipients": [ persona.telefono ]
	            },
	            "data":{
	                "text" : msj_inicio_EPA.messages[0].text + " \n " + msj_pregunta_1_EPA.messages[0].text
	            },
	            "origin": "conversations",
	            "context": {},
	            "saveHistory": false,
	            "systemMessage": "EPA Enviada al cliente",
	            "botNotification": true
	        };          

	      	console.log("[terminateConversation] :: [EPA] :: [Datos] :: [data channel] :: " + data.channel);
	            console.log("[terminateConversation] :: [EPA] :: [Datos] :: [data userID] :: " + data.userID);
	            console.log("[terminateConversation] :: [EPA] :: [Datos] :: [data orgID] :: " + data.orgID);
	            console.log("[terminateConversation] :: [EPA] :: [Datos] :: [data data Text :: " + data.data.text);
	            console.log("[terminateConversation] :: [EPA] :: [Datos] :: [data recipients] :: " + persona.telefono);
	            console.log("[terminateConversation] :: [EPA] :: [Datos] :: [config.url_EPA] :: " + config.url_EPA);
	            console.log("[terminateConversation] :: [EPA] :: [Datos] :: [config.authorization] :: " + config.authorization);
	            console.log("[terminateConversation] :: [EPA] :: [Datos] :: [persona.telefono] :: " + persona.telefono);
	      
	      	var options = {
	            method : 'POST',
	            url : config.url_EPA,
	            headers : { 
	              'Content-Type':'application/json',
	              'Authorization': config.authorization
	        	},
	        	data: data
	      	};

	      	console.log("[terminateConversation] :: [EPA] :: [Datos] :: [config.qa] :: ", config.qa);

	      	if(config.qa == "false")
			{
				await axios(options).then(function (response)
				{
		            if(response.status == 200 && response.statusText == 'OK')
		            {
						resultado.status = response.data.status;
						resultado.message = response.data.message;
						resultado.idCanal = response.data.idCanal;

	              		controlador.funciones.startClientTimeOut(persona.telefono, data, conversacion.conversationId);

	              		localStorage.setItem("preguntas_EPA_"+persona.telefono, "0");
	              		localStorage.setItem("preguntas_EPA_1"+data.userID, "No Respondio");
	              		localStorage.setItem("preguntas_EPA_2"+data.userID, "No Respondio");
	              		localStorage.setItem("preguntas_EPA_3"+data.userID, "No Respondio");
	              		//setStorage('clave_EPA_' + persona.telefono, 'Valor_EPA', parseInt(config.timer_EPA));  // 900 15 minutos   }
	            	}
		            else
		            {
						resultado.status = response.data.status;
						resultado.message = response.data.message;
						resultado.idCanal = response.data.idCanal;
	            	}

					console.log("[terminateConversation] :: [EPA] :: [OK] :: [status]:: " + resultado.status + " :: [EPAMenssage] :: " + resultado.message + " :: [EPAIdCanal] :: " + resultado.idCanal);
	          	})
	          	.catch(function (error)
	          	{
		            resultado.status = error.response.data.status;
		            resultado.message = error.response.data.message;

	            	console.log("[terminateConversation] :: [EPA] :: [ERROR] :: [status]:: " + resultado.status + " :: [EPAMenssage] :: " + resultado.message);
	          	});
	        }
	        else
	        {
	        	controlador.funciones.startClientTimeOut(persona.telefono, data, conversacion.conversationId);
	            localStorage.setItem("preguntas_EPA_"+persona.telefono, "0");

	          	resultado.status = "OK";
				resultado.message = data;
				
				localStorage.setItem("preguntas_EPA_1"+data.userID, "No Respondio");
          		localStorage.setItem("preguntas_EPA_2"+data.userID, "No Respondio");
          		localStorage.setItem("preguntas_EPA_3"+data.userID, "No Respondio");

				console.log("[terminateConversation] :: [EPA] :: [QA] :: ", resultado);
	        }       
		}
		else
		{
			resultado.status = "NOK";
			resultado.message = "El valor de conversacion es requerido";
		}
  	}
	else
	{
		resultado.status = "NOK";
		resultado.message = "El valor de la persona es requerido";    
	}

	res.status(200).json(resultado);
});

router.get('/test', async (req, res) => {
  var now = moment();
  var fecha_actual = now.tz("America/Santiago").format("YYYY-MM-DD HH:mm:ss");
  var anio = now.tz("America/Santiago").format("YYYY");
  
  var respuesta = "Bienvenido al menú Bot_EPA de <strong>Hites</strong> <br> " +
      "Hora CL Actual: <strong> " + fecha_actual + " </strong><br> " +
      "<strong> Sixbell "+anio+" - Versión: 1.0.0 </strong><br>";

  res.status(200).send(respuesta);
});

module.exports = router