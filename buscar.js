document.addEventListener('DOMContentLoaded', function() {
    const result = document.querySelector('.result');
    const form = document.querySelector('.get-weather');
    const nameCity = document.querySelector('#city');
    const nameCountry = document.querySelector('#country');
  



    let planMessageShown = false;

// Función para mostrar el mensaje de cambio de plan
function showChangePlanScreen() {
    if (!planMessageShown) {
        // Crear un elemento de mensaje
        const messageElement = document.createElement('p');
        messageElement.textContent = 'Has alcanzado el límite de 5 búsquedas por sesión. Debes cambiar tu plan.';

        // Crear un elemento de enlace
        const linkElement = document.createElement('a');
        linkElement.textContent = 'Actualizar el plan';
        linkElement.href = 'change.html'; // Agrega el enlace a donde desees que dirija

        // Agregar el enlace al mensaje
        messageElement.appendChild(document.createTextNode(' ')); // Espacio entre el mensaje y el enlace
        messageElement.appendChild(linkElement);

        // Obtener el elemento donde quieres mostrar el mensaje (por ejemplo, el div con clase "current-weather")
        const currentWeatherDiv = document.querySelector('.current-weather');

        // Agregar el mensaje al DOM debajo del clima
        currentWeatherDiv.appendChild(messageElement);

        // Marcar el mensaje como mostrado
        planMessageShown = true;
    }
}

// Función para actualizar el número de búsquedas y mostrar el mensaje si es necesario
function updateSearchCount() {
    // Obtener el número de búsquedas actual de la sesión
    let searchCount = localStorage.getItem('searchCount') || 0;
    searchCount = parseInt(searchCount);

    if (searchCount < 5) {
        // Realizar la búsqueda y actualizar el contador si es menor a 5
        callAPI(nameCity.value, nameCountry.value);
        searchCount++; // Incrementar el contador
        localStorage.setItem('searchCount', searchCount); // Almacenar el nuevo valor en la sesión
    } else {
        // Muestra un mensaje de límite alcanzado
        showChangePlanScreen();
    }
}

// Restablecer el estado del mensaje cuando sea necesario (por ejemplo, al recargar la página)
function resetPlanMessage() {
    planMessageShown = false;
}

// Llama a esta función cuando sea necesario para reiniciar el mensaje de cambio de plan
function resetSession() {
    resetPlanMessage(); // Restablecer el mensaje de cambio de plan
    localStorage.removeItem('searchCount'); // Eliminar el contador de búsqueda de la sesión
}

// Agrega un manejador de eventos al botón de "Cerrar Sesión"
const logoutButton = document.getElementById('logout-button');
logoutButton.addEventListener('click', function() {
    resetSession(); // Llama a la función para reiniciar la sesión cuando se hace clic en el botón
    // Realiza otras acciones de cierre de sesión si es necesario
    window.location.href = 'index.html';
});
    
    // Llama a esta función cuando se envíe el formulario
    form.addEventListener('submit', (e) => {
        e.preventDefault();
    
        if (nameCity.value === '' || nameCountry.value === '') {
            showError('Ambos campos son obligatorios...');
            return;
        }
    
        // Verificar y actualizar el número de búsquedas en la sesión
        updateSearchCount();
    });

    function callAPI(city, country) {
        const apiId = 'c258d43f134a5815d7e89e5354c52c0d';
        const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city},${country}&appid=${apiId}`;
        const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city},${country}&appid=${apiId}`;
    
        // Obtén la información del clima actual
        fetch(currentWeatherUrl)
            .then(data => data.json())
            .then(dataJSON => {
                if (dataJSON.cod === 404) {
                    showError('Ciudad no encontrada...');
                } else {
                    clearHTML();
                    showCurrentWeather(dataJSON);
                }
            })
            .catch(error => {
                console.log(error);
            });

        // Luego, obtén el pronóstico de 7 días
        fetch(forecastUrl)
            .then(data => data.json())
            .then(dataJSON => {
                if (dataJSON.cod === '404') {
                    showError('Ciudad no encontrada...');
                } else {
                    showHourlyForecast(dataJSON);
                    showWeeklyForecast(dataJSON);
                   
                }
            })
            .catch(error => {
                console.log(error);
            });
    }

    function showCurrentWeather(data) {
        const { name, main: { temp, temp_min, temp_max }, weather: [arr] } = data;

        const degrees = kelvinToCentigrade(temp);
        const min = kelvinToCentigrade(temp_min);
        const max = kelvinToCentigrade(temp_max);

        const content = document.createElement('div');
        content.innerHTML = `
            <h2>Clima en ${name} (Hoy)</h2>
            <img src="https://openweathermap.org/img/wn/${arr.icon}@2x.png" alt="icon">
            <h2>${degrees}°C</h2>
            <p>Max: ${max}°C</p>
            <p>Min: ${min}°C</p>
        `;

        const currentWeatherContainer = document.querySelector('.current-weather');
        currentWeatherContainer.innerHTML = ''; // Limpia el contenido anterior
        currentWeatherContainer.appendChild(content);
    }

    function showHourlyForecast(data) {
        const forecastList = data.list;
    
        // Obtiene la fecha actual
        const currentDate = new Date();
        const currentDay = currentDate.getDate();
    
        // Limpia la lista de resultados anteriores
        const hourlyTable = document.querySelector('.hourly-table');
       
        const tbody = hourlyTable.querySelector('tbody');
       
        tbody.innerHTML = '';
    
        // Itera a través de la lista de pronósticos por hora y crea filas para la tabla
        forecastList.forEach(forecast => {
            const { dt, main: { temp }, weather: [arr] } = forecast;
            const forecastDate = new Date(dt * 1000);
            const forecastDay = forecastDate.getDate();
            
    
            // Verifica si el pronóstico corresponde al día actual
            if (forecastDay === currentDay) {
                const formattedDateTime = forecastDate.toLocaleString('es-ES', {
                    hour: 'numeric',
                    minute: 'numeric',
                });
    
                const degrees = kelvinToCentigrade(temp);
                
                const row = document.createElement('tr'); // Crea una fila para la tabla
                row.innerHTML = `
                    <td><p>${formattedDateTime}</p></td>
                    <td><p>${degrees}°C</p></td>
                    <td><img src="https://openweathermap.org/img/wn/${arr.icon}@2x.png" alt="icon"></td>
                `;
    
                tbody.appendChild(row);
            }
        });
    
        // Mostrar la tabla después de llenarla
        hourlyTable.style.display = 'table'; // Cambia el estilo a "table" para mostrar la tabla
    }
    
    function showWeeklyForecast(data) {
        const { city: { name }, list } = data;
        const dailyForecasts = {};
        const currentDate = new Date(); // Obtener la fecha actual
        const currentDayOfWeek = currentDate.getDay(); // Día de la semana actual
    
        // Llenar los pronósticos para los próximos 7 días (excluyendo hoy)
        for (let i = 1; i <= 7; i++) {
            const nextDate = new Date(currentDate);
            nextDate.setDate(currentDate.getDate() + i);
            const dayOfMonth = nextDate.getDate();
            const dayOfWeek = nextDate.toLocaleDateString('es-ES', { weekday: 'long' });
    
            // Filtrar los pronósticos que corresponden al día
            const forecastsForDay = list.filter(forecast => {
                const forecastDate = new Date(forecast.dt * 1000);
                return forecastDate.getDate() === dayOfMonth;
            });
    
            // Calcular la temperatura mínima, máxima y el icono para el día
            if (forecastsForDay.length > 0) {
                const minTemp = kelvinToCentigrade(Math.min(...forecastsForDay.map(f => f.main.temp_min)));
                const maxTemp = kelvinToCentigrade(Math.max(...forecastsForDay.map(f => f.main.temp_max)));
                const icon = forecastsForDay[0].weather[0].icon;
                dailyForecasts[dayOfMonth] = { dayOfWeek, minTemp, maxTemp, icon };
            }
        }
    
        // Crear una tabla HTML para mostrar el pronóstico semanal
        const weeklyTable = document.createElement('table');
        weeklyTable.classList.add('cweekly-table');

        // Obtén la referencia al cuerpo de la tabla
        const tbody = document.createElement('tbody');
    
        // Llena la tabla con los datos del pronóstico semanal
        for (const dayOfMonth in dailyForecasts) {
            const { dayOfWeek, minTemp, maxTemp, icon } = dailyForecasts[dayOfMonth];
    
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><p>${dayOfWeek}</p></td>
                <td><p>${minTemp}°C</p></td>
                <td><p>${maxTemp}°C</p></td>
                <td><img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="icon"></td>
            `;
    
            tbody.appendChild(row);
        }
    
        // Agrega el cuerpo de la tabla a la tabla semanal
        weeklyTable.appendChild(tbody);
    
        // Elimina el contenido anterior y agrega la nueva tabla al contenedor de pronóstico semanal
        const weeklyForecastContainer = document.querySelector('.weekly-forecast');
        weeklyForecastContainer.innerHTML = '';
        weeklyForecastContainer.appendChild(weeklyTable);
        
    }

    
    function showError(message) {
        const alert = document.createElement('p');
        alert.classList.add('alert-message');
        alert.innerHTML = message;

        result.appendChild(alert);
        setTimeout(() => {
            alert.remove();
        }, 3000);
    }

    function kelvinToCentigrade(temp) {
        return parseInt(temp - 273.15);
    }

    function clearHTML() {
        result.innerHTML = '';
    }
});