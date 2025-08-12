document.addEventListener('DOMContentLoaded', function () {
    function toggleMenu() {
        const menu = document.getElementById('side-menu');
        if (menu) {
            menu.classList.toggle('active');
        }
    }
    window.toggleMenu = toggleMenu;

    const cepInput = document.getElementById('cep');
    if (cepInput) {
        const enderecoInput = document.getElementById('endereco-edicao') || document.getElementById('endereco');
        const cidadeInput = document.getElementById('cidade-edicao') || document.getElementById('cidade');

        cepInput.addEventListener('blur', () => {
            const cep = cepInput.value.replace(/\D/g, '');
            if (cep.length === 8) {
                fetch(`https://viacep.com.br/ws/${cep}/json/`)
                    .then(response => response.json())
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
                    .then(response => {
                        // Verifica se a resposta do servidor foi bem-sucedida
                        if (!response.ok) {
                            return response.json().then(errorData => {
                                throw new Error(errorData.erro);
                            });
                        }
                        return response.json();
                    })
                    .then(data => {
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
        const fecharModalIndisponivel = modalIndisponivel.querySelector('.fechar-modal');
        const voltarModalIndisponivel = modalIndisponivel.querySelector('.btn-voltar-modal');

        fecharModalIndisponivel.addEventListener('click', () => { modalIndisponivel.style.display = 'none'; });
        voltarModalIndisponivel.addEventListener('click', () => { modalIndisponivel.style.display = 'none'; });
        window.addEventListener('click', (event) => {
            if (event.target === modalIndisponivel) { modalIndisponivel.style.display = 'none'; }
        });

        livroBuscaInput.addEventListener('change', () => {
            const tituloBusca = livroBuscaInput.value;
            if (tituloBusca) {
                fetch(`/api/livro/completo/?titulo=${encodeURIComponent(tituloBusca)}`)
                    .then(response => {
                        if (!response.ok) {
                            return response.json().then(errorData => { throw new Error(errorData.erro); });
                        }
                        return response.json();
                    })
                    .then(data => {
                        livroCapaDisplay.src = data.capa;
                        livroCapaDisplay.style.display = 'block';
                        livroTituloDisplay.innerText = data.titulo;
                        livroAutorDisplay.innerText = data.autor;
                        livroEdicaoDisplay.innerText = `Edição: ${data.edicao}`;
                        livroNumeroPaginasDisplay.innerText = `Páginas: ${data.numero_paginas}`;
                        livroGeneroDisplay.innerText = `Gênero: ${data.genero}`;
                        livroClassificacaoDisplay.innerText = `Classificação: ${data.classificacao}`;

                        if (!data.disponivel) {
                            let mensagem = "Livro indisponível.";
                            if (data.data_devolucao_proxima) {
                                mensagem += ` Data mais próxima de devolução: ${data.data_devolucao_proxima}`;
                            }
                            mensagemIndisponivel.innerText = mensagem;
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
            document.getElementById('form-emprestimo').reset();
            document.getElementById('leitor-nome').innerText = '';
            document.getElementById('multa-info').innerText = '';
            document.getElementById('livro-capa').src = '';
            document.getElementById('livro-capa').style.display = 'none';
            document.getElementById('livro-titulo').innerText = '';
            document.getElementById('livro-autor').innerText = '';
            document.getElementById('livro-edicao').innerText = '';
            document.getElementById('livro-numero_paginas').innerText = '';
            document.getElementById('livro-genero').innerText = '';
            document.getElementById('livro-classificacao').innerText = '';
        });
    }

    const modalLivro = document.getElementById('modal-edicao');
    if (modalLivro) {
        const botoesEditarLivro = document.querySelectorAll('.tabela-estoque .btn-editar');
        const fecharModalLivro = modalLivro.querySelector('.fechar-modal');
        const voltarModalLivro = modalLivro.querySelector('.btn-voltar-modal');
        const formEdicaoLivro = document.getElementById('form-edicao');

        botoesEditarLivro.forEach(botao => {
            botao.addEventListener('click', (event) => {
                const linha = event.target.closest('tr');
                const livroId = linha.dataset.livroId;

                formEdicaoLivro.action = `/editar_livro/${livroId}/`;

                fetch(`/api/livro/buscar_por_id/?id=${livroId}`)
                    .then(response => response.json())
                    .then(data => {
                        if (!data.erro) {
                            document.getElementById('livro-id-edicao').value = livroId;
                            document.getElementById('titulo-edicao').value = data.titulo;
                            document.getElementById('autor-edicao').value = data.autor;
                            document.getElementById('genero-edicao').value = data.genero;
                            document.getElementById('classificacao-edicao').value = data.classificacao;
                            document.getElementById('quantidade-edicao').value = data.quantidade;
                            document.getElementById('edicao-edicao').value = data.edicao;
                            document.getElementById('numero_paginas-edicao').value = data.numero_paginas;
                            document.getElementById('sinopse-edicao').value = data.sinopse;

                            const capaPreview = document.getElementById('capa-preview');
                            if (data.capa_url) {
                                capaPreview.src = data.capa_url;
                                capaPreview.style.display = 'block';
                            } else {
                                capaPreview.style.display = 'none';
                            }

                            modalLivro.style.display = 'block';
                        } else {
                            alert(data.erro);
                        }
                    })
                    .catch(error => {
                        console.error('Erro ao buscar dados do livro:', error);
                        alert('Erro ao buscar dados do livro para edição.');
                    });
            });
        });

        fecharModalLivro.addEventListener('click', () => { modalLivro.style.display = 'none'; });
        voltarModalLivro.addEventListener('click', () => { modalLivro.style.display = 'none'; });
        window.addEventListener('click', (event) => {
            if (event.target === modalLivro) { modalLivro.style.display = 'none'; }
        });
    }

    const modalLeitor = document.getElementById('modal-edicao-leitor');
    if (modalLeitor) {
        const botoesEditarLeitor = document.querySelectorAll('.tabela-estoque .btn-editar');
        const fecharModalLeitor = modalLeitor.querySelector('.fechar-modal');
        const voltarModalLeitor = modalLeitor.querySelector('.btn-voltar-modal');
        const formEdicaoLeitor = document.getElementById('form-edicao-leitor');

        botoesEditarLeitor.forEach(button => {
            button.addEventListener('click', function () {
                const leitorId = this.dataset.leitorId;

                fetch(`/api/leitor/buscar_por_id/?id=${leitorId}`)
                    .then(response => response.json())
                    .then(data => {
                        if (!data.erro) {
                            document.getElementById('leitor-id-edicao').value = leitorId;
                            document.getElementById('nome-edicao').value = data.nome;
                            document.getElementById('celular-edicao').value = data.celular;
                            document.getElementById('email-edicao').value = data.email;
                            document.getElementById('cep-edicao').value = data.cep;
                            document.getElementById('endereco-edicao').value = data.endereco;
                            document.getElementById('complemento-edicao').value = data.complemento;
                            document.getElementById('cidade-edicao').value = data.cidade;

                            formEdicaoLeitor.action = `/usuarios/editar/${leitorId}/`;

                            modalLeitor.style.display = 'block';
                        } else {
                            alert(data.erro);
                        }
                    })
                    .catch(error => {
                        console.error('Erro ao buscar dados do leitor:', error);
                        alert('Erro ao buscar dados do leitor para edição.');
                    });
            });
        });

        fecharModalLeitor.addEventListener('click', () => { modalLeitor.style.display = 'none'; });
        voltarModalLeitor.addEventListener('click', () => { modalLeitor.style.display = 'none'; });
        window.addEventListener('click', function (event) {
            if (event.target === modalLeitor) { modalLeitor.style.display = 'none'; }
        });
    }

    const modalDevolucao = document.getElementById('modal-devolucao');
    if (modalDevolucao) {
        const botoesDevolucao = document.querySelectorAll('.btn-devolucao');
        const fecharModalSpan = modalDevolucao.querySelector('.fechar-modal');
        const voltarModalBtn = modalDevolucao.querySelector('.btn-voltar-modal');
        const dataEntregaInput = document.getElementById('data-entrega');
        const valorMultaDisplay = document.getElementById('valor-multa');
        const valorMultaHidden = document.getElementById('valor-multa-hidden');
        const formDevolucao = document.getElementById('form-devolucao');

        function fecharModal() {
            modalDevolucao.style.display = 'none';
        }

        fecharModalSpan.addEventListener('click', fecharModal);
        voltarModalBtn.addEventListener('click', fecharModal);
        window.addEventListener('click', (event) => {
            if (event.target === modalDevolucao) { fecharModal(); }
        });

        botoesDevolucao.forEach(botao => {
            botao.addEventListener('click', (event) => {
                const linha = event.target.closest('tr');
                const emprestimoId = botao.dataset.emprestimoId;
                const dataEmprestimo = linha.dataset.emprestimoData;

                const titulo = linha.querySelector('td:nth-child(1)').textContent.trim();
                const leitor = linha.querySelector('td:nth-child(2)').textContent.trim();
                const dataPrevista = linha.querySelector('td:nth-child(3)').textContent.trim();
                const atrasado = linha.querySelector('td:nth-child(4)').textContent.trim();

                document.getElementById('emprestimo-id').value = emprestimoId;
                document.getElementById('titulo-devolucao').textContent = titulo;
                document.getElementById('leitor-devolucao').textContent = leitor;
                document.getElementById('data-emprestimo-devolucao').textContent = dataEmprestimo;
                document.getElementById('data-devolucao-prevista').textContent = dataPrevista;
                document.getElementById('atrasado-devolucao').textContent = atrasado;

                formDevolucao.action = `/reservas/devolver/${emprestimoId}/`;

                modalDevolucao.style.display = 'block';
            });
        });

        dataEntregaInput.addEventListener('change', () => {
            const emprestimoId = document.getElementById('emprestimo-id').value;
            const dataEntrega = dataEntregaInput.value;

            if (dataEntrega) {
                fetch(`/api/calcular_multa/?emprestimo_id=${emprestimoId}&data_entrega=${dataEntrega}`)
                    .then(response => response.json())
                    .then(data => {
                        valorMultaDisplay.textContent = `R$ ${data.valor_multa.toFixed(2).replace('.', ',')}`;
                        valorMultaHidden.value = data.valor_multa;
                        if (data.atraso) {
                            document.getElementById('atrasado-devolucao').textContent = 'Sim';
                        } else {
                            document.getElementById('atrasado-devolucao').textContent = 'Não';
                        }
                    })
                    .catch(error => {
                        console.error('Erro ao calcular multa:', error);
                        valorMultaDisplay.textContent = 'Erro';
                    });
            }
        });
    }
});