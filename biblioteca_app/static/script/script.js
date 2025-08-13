document.addEventListener('DOMContentLoaded', function () {

   
    function toggleMenu() {
        const menu = document.getElementById('side-menu');
        if (menu) menu.classList.toggle('active');
    }
    window.toggleMenu = toggleMenu;

    
    const urlEmprestimo = window.urlEmprestimo || '/'; 

    
    const cepInput = document.getElementById('cep');
    if (cepInput) {
        const enderecoInput = document.getElementById('endereco-edicao') || document.getElementById('endereco');
        const cidadeInput = document.getElementById('cidade-edicao') || document.getElementById('cidade');

        cepInput.addEventListener('blur', () => {
            const cep = cepInput.value.replace(/\D/g, '');
            if (cep.length === 8) {
                fetch(`https://viacep.com.br/ws/${cep}/json/`)
                    .then(res => res.json())
                    .then(data => {
                        if (!data.erro) {
                            enderecoInput.value = `${data.logradouro}, ${data.bairro}`;
                            cidadeInput.value = `${data.localidade} - ${data.uf}`;
                        } else {
                            alert('CEP não encontrado.');
                            enderecoInput.value = '';
                            cidadeInput.value = '';
                        }
                    })
                    .catch(() => {
                        alert('Erro ao buscar o CEP.');
                        enderecoInput.value = '';
                        cidadeInput.value = '';
                    });
            }
        });
    }

    
    const cpfInput = document.getElementById('cpf');
    if (cpfInput) {
        const leitorNomeDisplay = document.getElementById('leitor-nome');
        const multaInfoDisplay = document.getElementById('multa-info');

        cpfInput.addEventListener('blur', () => {
            const cpf = cpfInput.value.replace(/\D/g, '');
            if (cpf.length === 11) {
                fetch(`/api/leitor/buscar/?cpf=${cpf}`)
                    .then(response => response.json())
                    .then(data => {
                        if (data.erro) throw new Error(data.erro);
                        leitorNomeDisplay.innerText = data.nome;
                        multaInfoDisplay.innerText = data.tem_multa ? 'Possui multa por atraso' : 'Não possui multas';
                    })
                    .catch(error => {
                        leitorNomeDisplay.innerText = error.message;
                        multaInfoDisplay.innerText = 'N/A';
                        console.error('Erro:', error);
                    });
            } else {
                leitorNomeDisplay.innerText = '';
                multaInfoDisplay.innerText = '';
            }
        });
    }

    
    const livroBuscaInput = document.getElementById('livro-busca');
    if (livroBuscaInput) {
        const livroCapaDisplay = document.getElementById('livro-capa');
        const livroTituloDisplay = document.getElementById('livro-titulo');
        const livroAutorDisplay = document.getElementById('livro-autor');
        const livroEdicaoDisplay = document.getElementById('livro-edicao');
        const livroNumeroPaginasDisplay = document.getElementById('livro-numero_paginas');
        const livroGeneroDisplay = document.getElementById('livro-genero');
        const livroClassificacaoDisplay = document.getElementById('livro-classificacao');
        const modalIndisponivel = document.getElementById('modal-livro-indisponivel');
        const mensagemIndisponivel = document.getElementById('mensagem-indisponivel');

        function fecharModal() { modalIndisponivel.style.display = 'none'; }
        modalIndisponivel.querySelectorAll('.fechar-modal, .btn-voltar-modal').forEach(btn => {
            btn.addEventListener('click', fecharModal);
        });
        window.addEventListener('click', (e) => { if (e.target === modalIndisponivel) fecharModal(); });

        livroBuscaInput.addEventListener('change', () => {
            const tituloBusca = livroBuscaInput.value;
            if (tituloBusca) {
                fetch(`/api/livro/completo/?titulo=${encodeURIComponent(tituloBusca)}`)
                    .then(res => res.json())
                    .then(data => {
                        if (data.erro) throw new Error(data.erro);

                        livroCapaDisplay.src = data.capa || '';
                        livroCapaDisplay.style.display = data.capa ? 'block' : 'none';
                        livroTituloDisplay.innerText = data.titulo;
                        livroAutorDisplay.innerText = data.autor;
                        livroEdicaoDisplay.innerText = `Edição: ${data.edicao}`;
                        livroNumeroPaginasDisplay.innerText = `Páginas: ${data.numero_paginas}`;
                        livroGeneroDisplay.innerText = `Gênero: ${data.genero}`;
                        livroClassificacaoDisplay.innerText = `Classificação: ${data.classificacao}`;

                        if (!data.disponivel) {
                            let msg = "Livro indisponível.";
                            if (data.data_devolucao_proxima) msg += ` Data mais próxima de devolução: ${data.data_devolucao_proxima}`;
                            mensagemIndisponivel.innerText = msg;
                            modalIndisponivel.style.display = 'block';
                        }
                    })
                    .catch(error => {
                        alert(error.message);
                        livroCapaDisplay.style.display = 'none';
                        livroTituloDisplay.innerText = 'Livro não encontrado.';
                        livroAutorDisplay.innerText = '';
                        livroEdicaoDisplay.innerText = '';
                        livroNumeroPaginasDisplay.innerText = '';
                        livroGeneroDisplay.innerText = '';
                        livroClassificacaoDisplay.innerText = '';
                    });
            }
        });
    }

    
    const limparBtn = document.querySelector('.btn-limpar');
    if (limparBtn) {
        limparBtn.addEventListener('click', () => {
            const form = document.getElementById('form-emprestimo');
            form.reset();
            ['leitor-nome','multa-info','livro-capa','livro-titulo','livro-autor','livro-edicao','livro-numero_paginas','livro-genero','livro-classificacao'].forEach(id => {
                const el = document.getElementById(id);
                if(el.tagName==='IMG'){ el.src=''; el.style.display='none'; }
                else el.innerText='';
            });
        });
    }

    
    const formEmprestimo = document.getElementById('form-emprestimo');
    if (formEmprestimo) {
        const modalSucesso = document.getElementById('modal-sucesso');
        const modalErro = document.getElementById('modal-erro');
        const mensagemSucesso = document.getElementById('mensagem-sucesso');
        const mensagemErro = document.getElementById('mensagem-erro');

        document.querySelectorAll('.fechar-modal-sucesso, .btn-fechar-modal-sucesso').forEach(btn => {
            btn.addEventListener('click', () => modalSucesso.style.display='none');
        });
        document.querySelectorAll('.fechar-modal-erro, .btn-fechar-modal-erro').forEach(btn => {
            btn.addEventListener('click', () => modalErro.style.display='none');
        });

        formEmprestimo.addEventListener('submit', function (e) {
            e.preventDefault();
            const formData = new FormData(formEmprestimo);

            fetch(urlEmprestimo, {
                method: "POST",
                body: formData,
                headers: { "X-Requested-With": "XMLHttpRequest" }
            })
            .then(res => res.json())
            .then(data => {
                if (data.sucesso) {
                    mensagemSucesso.innerText = data.mensagem;
                    modalSucesso.style.display = 'block';
                    formEmprestimo.reset();
                } else {
                    mensagemErro.innerText = data.mensagem;
                    modalErro.style.display = 'block';
                }
            })
            .catch(() => {
                mensagemErro.innerText = "Ocorreu um erro inesperado na comunicação com o servidor.";
                modalErro.style.display = 'block';
            });
        });
    }

});
