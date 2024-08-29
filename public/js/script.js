document.addEventListener("DOMContentLoaded", function() {
    const convertButton = document.getElementById('convertButton');
    if (convertButton) {
        convertButton.addEventListener('click', function () {
            html2canvas(document.querySelector(".comprovante-container")).then(function(canvas) {
                var link = document.createElement('a');
                link.download = 'comprovante.png';
                link.href = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
                link.click();
            });
        });
    }
});

function formatarData() {
    const dataElement = document.getElementById('data');
    const dataFormatadaElement = document.getElementById('data_formatada');

    if (dataElement && dataFormatadaElement) {
        const data = new Date(dataElement.value);
        const dia = String(data.getDate()).padStart(2, '0');
        const mes = String(data.getMonth() + 1).padStart(2, '0'); // Mês começa em 0
        const ano = data.getFullYear();

        const dataFormatada = `${dia}/${mes}/${ano}`;
        dataFormatadaElement.value = dataFormatada;
    }   
}


